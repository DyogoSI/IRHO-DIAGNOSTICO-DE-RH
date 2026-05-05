function afterProcessCreate(processId) {
    log.info(">>> DIAGNOSTICO RH: Iniciando envio de email COM ANEXO. Processo ID: " + processId);

    try {
        var emailContato = hAPI.getCardValue("email_contato");
        if (!emailContato || emailContato == "" || emailContato == "anonimo@teste.com") {
            log.warn(">>> DIAGNOSTICO RH: Email invalido. Cancelando envio.");
            return;
        }

        var nomeContato = hAPI.getCardValue("nome_contato");
        var empresa = hAPI.getCardValue("empresa");
        var scoreFinal = hAPI.getCardValue("score_final");
        var maturidade = hAPI.getCardValue("nivel_maturidade");
        var linkPdfPublico = hAPI.getCardValue("link_pdf_publico"); 
        var docIdAnexo = hAPI.getCardValue("id_pdf_diagnostico");

        // Reconstrói a String Base64 juntando as 20 partes separadas para burlar o limite do DB
        var base64String = "";
        for (var i = 1; i <= 20; i++) {
            var pedaco = hAPI.getCardValue("pdf_base64_" + i);
            if (pedaco != null && pedaco.trim() != "") {
                base64String += pedaco;
            }
        }

        // 1. Anexa o documento fisicamente ao processo e FORÇA O COMPARTILHAMENTO EXTERNO
        if (docIdAnexo) {
            try { 
                // Anexa ao workflow
                hAPI.attachDocument(parseInt(docIdAnexo)); 
                
                // Ativa o Compartilhamento Externo via API Nativa do Servidor
                var doc = docAPI.getDocument(parseInt(docIdAnexo), 1000); // Pega a versão ativa
                if (doc != null) {
                    doc.setPublicDocument(true); // Ativa "Compartilhar Externamente"
                    docAPI.updateDocument(doc);  // Atualiza no banco de dados do Fluig
                    log.info(">>> DIAGNOSTICO RH: Compartilhamento externo ativado com sucesso para o ID: " + docIdAnexo);
                }
            } catch(e) {
                log.error(">>> DIAGNOSTICO RH: Erro ao anexar documento ou ativar link publico: " + e.toString());
            }
        }

        // 2. Extrai os bytes do PDF da String Base64 remontada
        var pdfBytes = null;
        if (base64String && base64String.trim() !== "") {
            log.info(">>> DIAGNOSTICO RH: Convertendo PDF via Base64 enviado em partes pelo Form...");
            pdfBytes = java.util.Base64.getDecoder().decode(new java.lang.String(base64String).getBytes("UTF-8"));
        } else if (linkPdfPublico != null && linkPdfPublico.indexOf("http") !== -1) {
            log.info(">>> DIAGNOSTICO RH: Baixando PDF da URL publica para anexar...");
            pdfBytes = baixarBytesDaUrl(linkPdfPublico);
        }

        var assuntoEmail = "Resultado do seu Diagnóstico de RH: " + maturidade;
        var nomeArquivo = "Diagnostico_" + String(empresa).replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
        
        var htmlBody = "<div style='font-family: Arial, sans-serif; color: #333;'>" +
                       "<h2>Olá, " + nomeContato + "!</h2>" +
                       "<p>Agradecemos por realizar o Diagnóstico InteRHativa para a empresa <strong>" + empresa + "</strong>.</p>" +
                       "<div style='padding: 15px; background-color: #f8fbff; border-left: 4px solid #1eaad9; margin: 20px 0;'>" +
                       "<h3 style='margin: 0; color: #1eaad9;'>Seu Score Global: " + scoreFinal + "%</h3>" +
                       "<p style='margin: 5px 0 0 0; font-size: 16px;'>Nível de Maturidade: <strong>" + maturidade + "</strong></p>" +
                       "</div>" +
                       "<p><strong>O seu relatório completo segue em anexo a este e-mail (PDF).</strong> Basta descarregá-lo diretamente da sua caixa de entrada.</p>" +
                       "<p>Nossos especialistas avaliarão as suas respostas e entrarão em contacto para apresentar as melhores oportunidades de desenvolvimento e transformação.</p>" +
                       "<p>Abraço,<br>Equipa de Especialistas em RH.</p>" +
                       "</div>";

        // =========================================================
        // TENTATIVA 1: Enviar com Anexo Físico (JavaMail)
        // =========================================================
        try {
            enviarEmailComAnexo(emailContato, assuntoEmail, htmlBody, nomeArquivo, pdfBytes);
            log.info(">>> DIAGNOSTICO RH: Email COM ANEXO enviado com sucesso!");
            
        } catch (mailError) {
            log.error(">>> DIAGNOSTICO RH: Servidor SMTP bloqueou o JavaMail. Executando plano de fallback... Erro: " + mailError);
            
            // =========================================================
            // TENTATIVA 2: Fallback de Segurança (Fluig Nativo)
            // =========================================================
            var parametros = new java.util.HashMap();
            parametros.put("NOME_CONTATO", nomeContato);
            parametros.put("NOME_EMPRESA", empresa);
            parametros.put("SCORE_FINAL", scoreFinal + "%");
            parametros.put("MATURIDADE", maturidade);
            parametros.put("LINK_PDF", linkPdfPublico); 
            parametros.put("subject", assuntoEmail);
            
            var destinatarios = new java.util.ArrayList();
            destinatarios.add(String(emailContato).trim());
            
            notifier.notify("guilherme-af", "TPL_DIAGNOSTICO_RESULTADO", parametros, destinatarios, "text/html");
            log.info(">>> DIAGNOSTICO RH: Email de seguranca enviado com sucesso via notifier!");
        }

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH: ERRO FATAL NO SCRIPT: " + e.toString());
    }
}

/**
 * Constrói o e-mail utilizando as configurações nativas do servidor e anexa o PDF
 */
function enviarEmailComAnexo(destinatario, assunto, htmlBody, nomeArquivo, pdfBytes) {
    var initialContext = new javax.naming.InitialContext();
    var session = initialContext.lookup("java:/mail/MailSession");
    
    var msg = new javax.mail.internet.MimeMessage(session);
    
    var fromAddress = session.getProperty("mail.from");
    if (fromAddress != null && fromAddress.trim() != "") {
        msg.setFrom(new javax.mail.internet.InternetAddress(fromAddress));
    }
    
    msg.setRecipients(javax.mail.Message.RecipientType.TO, javax.mail.internet.InternetAddress.parse(destinatario));
    msg.setSubject(assunto, "UTF-8");

    var multipart = new javax.mail.internet.MimeMultipart();

    // Parte de Texto
    var htmlPart = new javax.mail.internet.MimeBodyPart();
    htmlPart.setContent(htmlBody, "text/html; charset=utf-8");
    multipart.addBodyPart(htmlPart);

    // Parte de Anexo
    if (pdfBytes != null) {
        var attachmentPart = new javax.mail.internet.MimeBodyPart();
        var dataSource = new javax.mail.util.ByteArrayDataSource(pdfBytes, "application/pdf");
        attachmentPart.setDataHandler(new javax.activation.DataHandler(dataSource));
        attachmentPart.setFileName(nomeArquivo);
        multipart.addBodyPart(attachmentPart);
    }

    msg.setContent(multipart);
    javax.mail.Transport.send(msg);
}

/**
 * Lê os bytes do ficheiro PDF via HTTP utilizando a URL pública
 */
function baixarBytesDaUrl(urlStr) {
    try {
        var url = new java.net.URL(urlStr);
        var conn = url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000); 
        conn.setReadTimeout(10000);   
        
        if (conn.getResponseCode() >= 300) {
            log.error(">>> DIAGNOSTICO RH: URL HTTP recusou a entrega do ficheiro.");
            return null;
        }
        
        var is = conn.getInputStream();
        var bytes = org.apache.commons.io.IOUtils.toByteArray(is);
        is.close();
        return bytes;
    } catch (e) {
        log.error(">>> DIAGNOSTICO RH: Falha ao baixar o PDF - " + e.toString());
        return null;
    }
}