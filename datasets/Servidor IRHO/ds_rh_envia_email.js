function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("message");

    var emailContato = "", nomeContato = "", empresa = "", scoreFinal = "", maturidade = "", jsonInsights = "";
    
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "emailContato") emailContato = constraints[i].initialValue;
            if (constraints[i].fieldName == "nomeContato") nomeContato = constraints[i].initialValue;
            if (constraints[i].fieldName == "empresa") empresa = constraints[i].initialValue;
            if (constraints[i].fieldName == "scoreFinal") scoreFinal = constraints[i].initialValue;
            if (constraints[i].fieldName == "maturidade") maturidade = constraints[i].initialValue;
            if (constraints[i].fieldName == "json_insights") jsonInsights = constraints[i].initialValue;
        }
    }

    if (emailContato == "") {
        dataset.addRow(["ERROR", "Email nao informado"]);
        return dataset;
    }

    try {
        // ASSUNTO FORMATADO CONFORME SOLICITADO
        var assuntoEmail = "📊 Resultado: A maturidade do RH da " + empresa + " é " + maturidade;
        
        var sdf = new java.text.SimpleDateFormat("dd/MM/yyyy");
        var dataAtualFormatada = sdf.format(new java.util.Date());
        
        // Transforma o JSON de Insights em blocos HTML
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
            } catch (e) {
                log.warn(">>> DIAGNOSTICO RH: Erro ao fazer parse dos insights no email: " + e.toString());
            }
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
        
        dataset.addRow(["SUCCESS", "Email disparado com sucesso via Notifier"]);
        log.info(">>> DIAGNOSTICO RH: Notifier concluido com sucesso para " + emailContato);
        
    } catch (e) {
        log.error(">>> ERRO DATASET EMAIL (NOTIFIER): " + e.toString());
        dataset.addRow(["ERROR", e.toString()]);
    }
    
    return dataset;
}