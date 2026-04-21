function afterProcessCreate(processId) {
    log.info(">>> DIAGNOSTICO RH: Iniciando disparo de email customizado. Processo ID: " + processId);

    try {
        var docIdAnexo = hAPI.getCardValue("id_pdf_diagnostico");
        var pdfBytes = null; // Variável que receberá os bytes do PDF

        // --- LÓGICA PARA ANEXAR O PDF E EXTRAIR OS BYTES ---
        if (docIdAnexo != null && docIdAnexo != "") {
            // 1. Anexa ao processo interno do Fluig
            hAPI.attachDocument(parseInt(docIdAnexo));
            log.info(">>> DIAGNOSTICO RH: PDF (ID: " + docIdAnexo + ") anexado com sucesso ao processo!");
            
            // 2. Extrai os bytes do documento usando a função proxy
            pdfBytes = baixarBytesInterno(docIdAnexo, null);
            
            if (pdfBytes != null) {
                log.info(">>> DIAGNOSTICO RH: Bytes do PDF extraídos com sucesso. Tamanho: " + pdfBytes.length + " bytes.");
            }
        }
        // ---------------------------------------------------

        // 1. Recupera os dados que foram injetados no formulário pela Widget via API
        var nomeContato = hAPI.getCardValue("nome_contato");
        var emailContato = hAPI.getCardValue("email_contato");
        var empresa = hAPI.getCardValue("empresa");
        var scoreFinal = hAPI.getCardValue("score_final");
        var maturidade = hAPI.getCardValue("nivel_maturidade");

        // 2. Validação: Apenas envia se houver um e-mail válido 
        // Ignora o fallback "anonimo@teste.com" preenchido pela widget
        if (emailContato != null && emailContato != "" && emailContato != "anonimo@teste.com") {

            // 3. Preparação dos parâmetros para o Template HTML
            var parametros = new java.util.HashMap();

            // Variáveis que serão trocadas no HTML do email
            parametros.put("NOME_CONTATO", nomeContato);
            parametros.put("NOME_EMPRESA", empresa);
            parametros.put("SCORE_FINAL", scoreFinal + "%");
            parametros.put("MATURIDADE", maturidade);
            
            // Assunto do E-mail (Requerido pelo Fluig)
            var assuntoEmail = "Resultado do seu Diagnóstico de RH: " + maturidade;
            parametros.put("subject", assuntoEmail);
            parametros.put("SUBJECT", assuntoEmail);

            // 4. Configuração de Destinatários
            var destinatarios = new java.util.ArrayList();
            // Remove espaços acidentais que possam causar o erro "Invalid Addresses"
            destinatarios.add(String(emailContato).trim());

            // 5. Disparo do E-mail
            var remetente = "guilherme-af"; // Usuário remetente padrão
            var idTemplate = "TPL_DIAGNOSTICO_RESULTADO"; // Nome do template cadastrado no painel de controle
            
            log.info(">>> DIAGNOSTICO RH: Tentando enviar e-mail para: " + emailContato);
            
            /*
             * NOTA SOBRE ANEXO NO E-MAIL:
             * A variável 'pdfBytes' agora contém o arquivo físico. O 'notifier.notify' padrão 
             * não aceita os bytes nativamente na assinatura abaixo. Se a sua intenção for anexar 
             * o arquivo no e-mail, você precisará construir o envio via 'javax.mail' ou usar
             * o 'com.totvs.technology.foundation.mail.EMailAttachmentVO'. 
             */
            notifier.notify(remetente, idTemplate, parametros, destinatarios, "text/html");

            log.info(">>> DIAGNOSTICO RH: E-mail enviado com sucesso!");

        } else {
            log.warn(">>> DIAGNOSTICO RH: E-mail não preenchido ou é anônimo. Envio cancelado.");
        }

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH: ERRO FATAL AO PROCESSAR AFTER CREATE: " + e);
        if (e.toString) log.error(e.toString());
    }
}

/**
 * Função responsável por bypassar a API pública e extrair os bytes 
 * de um documento armazenado no volume interno do Fluig (GED).
 */
function baixarBytesInterno(docId, config) {
    try {
        var docIdInt = parseInt(docId, 10);
        
        // MÁGICA AQUI: Pede ao serviço interno do Fluig a URL de download. 
        // Essa URL gerada internamente já bypassa o bloqueio do /api/public/
        var downloadUrl = fluigAPI.getDocumentService().getDownloadURL(docIdInt);

        if (!downloadUrl) {
            log.error(">>> [PROXY LOTE] A fluigAPI interna não retornou URL para o doc " + docId);
            return null;
        }

        // Garante que a URL seja absoluta
        if (downloadUrl.indexOf("http") !== 0) {
            var serverUrl = "";
            try { 
                serverUrl = fluigAPI.getPageService().getServerURL(); 
            } catch (ex) { 
                serverUrl = "http://localhost:8080"; 
            }
            downloadUrl = serverUrl + downloadUrl;
        }

        log.info(">>> [PROXY LOTE] Acessando volume interno do Fluig para o doc " + docId);

        // Abre a conexão com a URL gerada (que já é confiável para o servidor local)
        var fileConn = new java.net.URL(downloadUrl).openConnection();
        fileConn.setRequestMethod("GET");
        
        var responseCode = fileConn.getResponseCode();
        if (responseCode >= 300) {
            var errScanner = new java.util.Scanner(fileConn.getErrorStream(), "UTF-8").useDelimiter("\\A");
            var errMsg = errScanner.hasNext() ? errScanner.next() : "";
            log.error(">>> [PROXY LOTE] Falha ao extrair stream (HTTP " + responseCode + "): " + errMsg);
            errScanner.close();
            return null;
        }

        // Extrai os bytes puros do PDF
        var isFile = fileConn.getInputStream();
        var bytes = org.apache.commons.io.IOUtils.toByteArray(isFile);
        isFile.close();
        
        return bytes;
        
    } catch(e) {
        log.error(">>> [PROXY LOTE] Erro fatal ao extrair PDF ID " + docId + " via fluigAPI - " + e.toString());
        return null;
    }
}

