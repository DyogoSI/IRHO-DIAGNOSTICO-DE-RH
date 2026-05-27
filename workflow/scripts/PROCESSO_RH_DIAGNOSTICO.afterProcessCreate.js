function afterProcessCreate(processId) {
    log.info(">>> DIAGNOSTICO RH: Processo criado. ID: " + processId);

    try {
        var scoreFinal = hAPI.getCardValue("score_final");
        
        if (!scoreFinal || scoreFinal == "" || scoreFinal == "0") {
            return; 
        }

        var emailContato = hAPI.getCardValue("email_contato");
        if (!emailContato || emailContato == "" || emailContato == "anonimo@teste.com") {
            return;
        }

        var nomeContato = hAPI.getCardValue("nome_contato");
        var empresa = hAPI.getCardValue("empresa");
        var maturidade = hAPI.getCardValue("nivel_maturidade");
        var jsonInsights = hAPI.getCardValue("json_insights");

        var docIdAnexo = hAPI.getCardValue("id_pdf_diagnostico");
        if (docIdAnexo) {
            try { 
                hAPI.attachDocument(parseInt(docIdAnexo)); 
                var doc = docAPI.getDocument(parseInt(docIdAnexo), 1000); 
                if (doc != null) {
                    doc.setPublicDocument(true); 
                    docAPI.updateDocument(doc);  
                }
            } catch(e) {}
        }

        var assuntoEmail = "📊 Resultado: A maturidade do RH da " + empresa + " é " + maturidade;
        
        var sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
        var dataAtualFormatada = sdf.format(new java.util.Date());

        var htmlInsightsStr = "";
        if (jsonInsights != null && jsonInsights != "" && jsonInsights.length > 5) {
            try {
                var insightsList = JSON.parse(jsonInsights);
                for (var j = 0; j < insightsList.length; j++) {
                    htmlInsightsStr += "<div style='margin-bottom: 12px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #1eaad9; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);'>" +
                                       "<h4 style='margin: 0 0 5px 0; color: #004b8d; font-size: 15px; font-weight: 700;'>" + insightsList[j].titulo + "</h4>" +
                                       "<p style='margin: 0; font-size: 14px; color: #4a5568; line-height: 1.4;'>" + insightsList[j].descricao + "</p>" +
                                       "</div>";
                }
            } catch(e) {}
        }

        var parametros = new java.util.HashMap();
        parametros.put("nomeContato", nomeContato);
        parametros.put("empresa", empresa);
        parametros.put("scoreFinal", scoreFinal);
        parametros.put("maturidade", maturidade);
        parametros.put("subject", assuntoEmail);
        parametros.put("dataAtual", dataAtualFormatada);
        parametros.put("htmlInsights", htmlInsightsStr);
        
        var destinatarios = new java.util.ArrayList();
        destinatarios.add(String(emailContato).trim());
        
        notifier.notify("guilherme-af", "TPL_DIAGNOSTICO_RESULTADO", parametros, destinatarios, "text/html");

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH: ERRO FATAL NO ENVIO: " + e.toString());
    }
}