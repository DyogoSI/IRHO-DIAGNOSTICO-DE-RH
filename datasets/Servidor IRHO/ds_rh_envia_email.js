function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("message");

    var emailContato = "", nomeContato = "", empresa = "", scoreFinal = "", maturidade = "", linkPdfPublico = "";
    
    // Captura as variaveis enviadas pelo Widget
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "emailContato") emailContato = constraints[i].initialValue;
            if (constraints[i].fieldName == "nomeContato") nomeContato = constraints[i].initialValue;
            if (constraints[i].fieldName == "empresa") empresa = constraints[i].initialValue;
            if (constraints[i].fieldName == "scoreFinal") scoreFinal = constraints[i].initialValue;
            if (constraints[i].fieldName == "maturidade") maturidade = constraints[i].initialValue;
            if (constraints[i].fieldName == "linkPdfPublico") linkPdfPublico = constraints[i].initialValue;
        }
    }

    if (emailContato == "") {
        dataset.addRow(["ERROR", "Email nao informado"]);
        return dataset;
    }

    try {
        var pdfBytes = null;
        if (linkPdfPublico != "") {
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

        // TENTATIVA 1: Enviar Email com Anexo embutido via JavaMail
        try {
            enviarEmailComAnexo(emailContato, assuntoEmail, htmlBody, nomeArquivo, pdfBytes);
            dataset.addRow(["SUCCESS", "Email enviado com sucesso (Com Anexo)"]);
            log.info(">>> DIAGNOSTICO RH: Dataset enviou email com sucesso para " + emailContato);
            
        } catch (mailError) {
            log.warn(">>> DIAGNOSTICO RH: Erro no JavaMail nativo. Acionando Fallback Notifier para: " + emailContato);
            
            // TENTATIVA 2: Fallback (Mesma logica de emergencia que funcionava no seu processo antigo)
            try {
                var parametros = new java.util.HashMap();
                parametros.put("NOME_CONTATO", nomeContato);
                parametros.put("NOME_EMPRESA", empresa);
                parametros.put("SCORE_FINAL", scoreFinal + "%");
                parametros.put("MATURIDADE", maturidade);
                parametros.put("LINK_PDF", linkPdfPublico); 
                parametros.put("subject", assuntoEmail);
                
                var destinatarios = new java.util.ArrayList();
                destinatarios.add(String(emailContato).trim());
                
                // Dispara usando o motor de notificacao nativo do Fluig
                notifier.notify("guilherme-af", "TPL_DIAGNOSTICO_RESULTADO", parametros, destinatarios, "text/html");
                
                dataset.addRow(["SUCCESS", "Email disparado com sucesso via Fallback Notifier"]);
                log.info(">>> DIAGNOSTICO RH: Fallback Notifier concluido com sucesso!");
                
            } catch (fallbackError) {
                log.error(">>> DIAGNOSTICO RH: Erro FATAL no Fallback de E-mail: " + fallbackError.toString());
                dataset.addRow(["ERROR", "Falha nos dois metodos de envio: " + fallbackError.toString()]);
            }
        }

    } catch (e) {
        log.error(">>> ERRO DATASET EMAIL: " + e.toString());
        dataset.addRow(["ERROR", e.toString()]);
    }
    return dataset;
}

// Funcao Auxiliar 1: Disparo JavaMail
function enviarEmailComAnexo(destinatario, assunto, htmlBody, nomeArquivo, pdfBytes) {
    var initialContext = new javax.naming.InitialContext();
    var session = initialContext.lookup("java:/mail/MailSession");
    var msg = new javax.mail.internet.MimeMessage(session);
    var fromAddress = session.getProperty("mail.from");
    if (fromAddress != null && fromAddress.trim() != "") msg.setFrom(new javax.mail.internet.InternetAddress(fromAddress));
    msg.setRecipients(javax.mail.Message.RecipientType.TO, javax.mail.internet.InternetAddress.parse(destinatario));
    msg.setSubject(assunto, "UTF-8");
    var multipart = new javax.mail.internet.MimeMultipart();
    var htmlPart = new javax.mail.internet.MimeBodyPart();
    htmlPart.setContent(htmlBody, "text/html; charset=utf-8");
    multipart.addBodyPart(htmlPart);
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

// Funcao Auxiliar 2: Baixar PDF do GED para embutir
function baixarBytesDaUrl(urlStr) {
    try {
        var url = new java.net.URL(urlStr);
        var conn = url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000); 
        conn.setReadTimeout(10000);   
        if (conn.getResponseCode() >= 300) return null;
        var is = conn.getInputStream();
        var bytes = org.apache.commons.io.IOUtils.toByteArray(is);
        is.close();
        return bytes;
    } catch (e) { return null; }
}