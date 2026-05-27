function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("message");
    dataset.addColumn("eventoId");

    try {
        var jsonDados = "";
        var email = "";
        var eventoId = "";
        var acao = "INSERIR_LEAD"; 
        
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                if (constraints[i].fieldName == "jsonDados") jsonDados = constraints[i].initialValue;
                if (constraints[i].fieldName == "email") email = constraints[i].initialValue;
                if (constraints[i].fieldName == "eventoId") eventoId = constraints[i].initialValue;
                if (constraints[i].fieldName == "acao") acao = constraints[i].initialValue;
            }
        }

        if (jsonDados == "" || eventoId == "") throw "Dataset requer 'jsonDados' e 'eventoId'.";
        var dadosObj = JSON.parse(jsonDados);

        var c1 = DatasetFactory.createConstraint("workflowProcessPK.processInstanceId", eventoId, eventoId, ConstraintType.MUST);
        var dsProcess = DatasetFactory.getDataset("workflowProcess", ["cardDocumentId"], [c1], null);
        
        if (dsProcess == null || dsProcess.rowsCount == 0) {
            dataset.addRow(new Array("WARNING", "O Fluig ainda esta indexando o processo " + eventoId, eventoId));
            return dataset;
        }

        var cardDocumentId = dsProcess.getValue(0, "cardDocumentId");
        if (!cardDocumentId || cardDocumentId == "" || cardDocumentId == "null") {
            dataset.addRow(new Array("WARNING", "ID do Documento ainda nao indexado.", eventoId));
            return dataset;
        }

        var cardDataArray = [];

        // =========================================================================
        // AÇÃO 1: ATUALIZAÇÃO PROGRESSIVA (PASSOS DO FRONT-END)
        // =========================================================================
        if (acao == "ATUALIZAR_PROGRESSIVO") {
            for (var key in dadosObj) {
                if (dadosObj.hasOwnProperty(key)) {
                    var val = dadosObj[key];
                    if (val === null || val === undefined) val = "";
                    cardDataArray.push({ "field": key, "value": val.toString() });
                }
            }
            atualizarFormularioFluigSOAP(cardDocumentId, cardDataArray);
            dataset.addRow(new Array("SUCCESS", "Atualizacao progressiva concluida no form via SOAP", eventoId));
            return dataset; 
        }

        // =========================================================================
        // AÇÃO 2: INSERIR LINHA NA TABELA CRM (PASSO FINAL)
        // =========================================================================
        if (acao == "INSERIR_LEAD") {
            
            // 1. Injeta os dados da tela primeiro
            for (var k in dadosObj) {
                if (dadosObj.hasOwnProperty(k)) {
                    var v = dadosObj[k];
                    if (v === null || v === undefined) v = "";
                    cardDataArray.push({ "field": k, "value": v.toString() });
                }
            }

            // 2. Lê apenas as linhas filhas do banco
            var c2 = DatasetFactory.createConstraint("documentid", cardDocumentId, cardDocumentId, ConstraintType.MUST);
            var dsForm = DatasetFactory.getDataset("ds_form_leads_rh", null, [c2], null);
            var maxIndex = 0;

            if (dsForm != null && dsForm.rowsCount > 0) {
                var colNames = dsForm.getColumnsName();
                for (var i = 0; i < dsForm.rowsCount; i++) {
                    var tablename = dsForm.getValue(i, "tablename");
                    var isChild = (tablename != null && tablename != "");
                    var rowId = dsForm.getValue(i, "id");
                    
                    if (isChild && rowId != null && rowId != "") {
                        var sufixo = "_" + rowId;
                        var currentIndex = parseInt(rowId);
                        if (currentIndex > maxIndex) maxIndex = currentIndex;
                        
                        for (var j = 0; j < colNames.length; j++) {
                            var colName = colNames[j];
                            if (colName == "documentid" || colName == "version" || colName == "companyid" || colName == "cardid" || colName == "tablename" || colName == "id" || colName == "tableid") continue;
                            
                            var valDB = dsForm.getValue(i, colName);
                            if (valDB != null && valDB != "") {
                                var finalFieldName = colName + sufixo;
                                var alreadyExists = false;
                                for (var idx = 0; idx < cardDataArray.length; idx++) { if (cardDataArray[idx].field == finalFieldName) { alreadyExists = true; break; } }
                                if (!alreadyExists) cardDataArray.push({ "field": finalFieldName, "value": valDB });
                            }
                        }
                    }
                }
            }

            // 3. Adiciona a nova interação
            var nextIndex = maxIndex + 1;
            var scoreInt = parseInt(dadosObj.score_final || "0");
            var maturidade = dadosObj.nivel_maturidade || "RH Tradicional";
            var dataAtual = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date());

            cardDataArray.push({"field": "tb_data_interacao___" + nextIndex, "value": dataAtual});
            cardDataArray.push({"field": "tb_empresa___" + nextIndex, "value": dadosObj.empresa || ""});
            cardDataArray.push({"field": "tb_nome_contato___" + nextIndex, "value": dadosObj.nome_contato || ""});
            cardDataArray.push({"field": "tb_email_contato___" + nextIndex, "value": dadosObj.email_contato || email});
            cardDataArray.push({"field": "tb_telefone___" + nextIndex, "value": dadosObj.telefone || ""});
            cardDataArray.push({"field": "tb_score_final___" + nextIndex, "value": scoreInt.toString()});
            cardDataArray.push({"field": "tb_nivel_maturidade___" + nextIndex, "value": maturidade});
            cardDataArray.push({"field": "tb_json_respostas___" + nextIndex, "value": jsonDados});

            // INSERÇÃO DOS NOVOS CAMPOS COMERCIAIS
            cardDataArray.push({"field": "tb_linkedin_url___" + nextIndex, "value": dadosObj.linkedin_url || ""});
            cardDataArray.push({"field": "tb_flag_conexao_linkedin___" + nextIndex, "value": dadosObj.flag_conexao_linkedin || ""});
            cardDataArray.push({"field": "tb_flag_envio_email___" + nextIndex, "value": dadosObj.flag_envio_email || ""});
            cardDataArray.push({"field": "tb_flag_whatsapp___" + nextIndex, "value": dadosObj.flag_whatsapp || ""});
            cardDataArray.push({"field": "tb_flag_mensagem_linkedin___" + nextIndex, "value": dadosObj.flag_mensagem_linkedin || ""});

            atualizarFormularioFluigSOAP(cardDocumentId, cardDataArray);
            dataset.addRow(new Array("SUCCESS", "Lead inserido com sucesso via SOAP na linha " + nextIndex, eventoId));
        }

    } catch (e) {
        dataset.addRow(new Array("ERROR", e.toString(), "0"));
    }
    return dataset;
}

// MOTOR DE ATUALIZAÇÃO DEFINITIVO E BLINDADO CONTRA ERRO DE SSL
function atualizarFormularioFluigSOAP(documentId, cardDataArray) {
    var urlStr = "https://fluig.irho.com.br/webdesk/ECMCardService";
    
    var usuario = "guilherme-af";
    // =========================================================================
    // COLOQUE A SENHA DO GUILHERME AQUI DE NOVO:
    // =========================================================================
    var senha = "Avwc1920."; 

    var escapeXml = function(unsafe) {
        if (unsafe == null) return "";
        return unsafe.toString().replace(/[<>&'"]/g, function (c) {
            switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;'; }
        });
    };

    var envelope =
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.dm.ecm.technology.totvs.com/">\n' +
        '<soapenv:Header/>\n' +
        '<soapenv:Body>\n' +
        '<ws:updateCardData>\n' +
        '<companyId>1</companyId>\n' +
        '<username>' + usuario + '</username>\n' +
        '<password>' + senha + '</password>\n' +
        '<cardId>' + documentId + '</cardId>\n' +
        '<cardData>\n';

    for (var i = 0; i < cardDataArray.length; i++) {
        envelope += '<item>\n<field>' + escapeXml(cardDataArray[i].field) + '</field>\n<value>' + escapeXml(cardDataArray[i].value) + '</value>\n</item>\n';
    }

    envelope += '</cardData>\n</ws:updateCardData>\n</soapenv:Body>\n</soapenv:Envelope>';

    // --- CÓDIGO NINJA: Ignorar a validação de Certificado SSL do HTTPS ---
    var trustAllCerts = java.lang.reflect.Array.newInstance(javax.net.ssl.TrustManager, 1);
    trustAllCerts[0] = new javax.net.ssl.X509TrustManager({
        getAcceptedIssuers: function() { return null; },
        checkClientTrusted: function(certs, authType) { },
        checkServerTrusted: function(certs, authType) { }
    });

    var sc = javax.net.ssl.SSLContext.getInstance("SSL");
    sc.init(null, trustAllCerts, new java.security.SecureRandom());
    javax.net.ssl.HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());

    var allHostsValid = new javax.net.ssl.HostnameVerifier({
        verify: function(hostname, session) { return true; }
    });
    javax.net.ssl.HttpsURLConnection.setDefaultHostnameVerifier(allHostsValid);
    // ----------------------------------------------------------------------

    var client = new java.net.URL(urlStr);
    var connection = client.openConnection();
    connection.setRequestMethod("POST"); 
    connection.setRequestProperty("Content-Type", "text/xml; charset=UTF-8");
    connection.setRequestProperty("SOAPAction", ""); 
    connection.setConnectTimeout(15000);
    connection.setReadTimeout(15000);
    connection.setDoOutput(true);
    
    var os = connection.getOutputStream();
    var input = new java.lang.String(envelope).getBytes("UTF-8");
    os.write(input, 0, input.length);
    os.flush();
    os.close();

    var code = connection.getResponseCode();
    if (code >= 200 && code < 300) {
        return true; 
    } else {
        var errStr = "";
        try { var scanner = new java.util.Scanner(connection.getErrorStream()).useDelimiter("\\A"); errStr = scanner.hasNext() ? scanner.next() : ""; } catch(e) {}
        throw "Erro SOAP " + code + ": " + errStr;
    }
}