function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");
    dataset.addColumn("message");
    dataset.addColumn("eventoId");

    try {
        var jsonDados = "";
        var email = "";
        var eventoId = "";
        
        // 1. Receber as constraints da Widget
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                if (constraints[i].fieldName == "jsonDados") jsonDados = constraints[i].initialValue;
                if (constraints[i].fieldName == "email") email = constraints[i].initialValue;
                if (constraints[i].fieldName == "eventoId") eventoId = constraints[i].initialValue;
            }
        }

        if (jsonDados == "" || eventoId == "") {
            throw "O Dataset precisa de receber os campos 'jsonDados' e 'eventoId'.";
        }

        var dadosObj = JSON.parse(jsonDados);

        // 2. Encontrar o DocumentID do Formulário através do ID do Processo
        var c1 = DatasetFactory.createConstraint("workflowProcessPK.processInstanceId", eventoId, eventoId, ConstraintType.MUST);
        var dsProcess = DatasetFactory.getDataset("workflowProcess", ["cardDocumentId"], [c1], null);
        
        if (dsProcess == null || dsProcess.rowsCount == 0) {
            throw "Processo agrupador de Evento (" + eventoId + ") não encontrado.";
        }
        var cardDocumentId = dsProcess.getValue(0, "cardDocumentId");

        // 3. Ler o dataset do formulário atual para PRESERVAR os dados existentes
        var c2 = DatasetFactory.createConstraint("documentid", cardDocumentId, cardDocumentId, ConstraintType.MUST);
        // "ds_form_leads_rh" é o nome interno que o Fluig dá ao dataset do formulário exportado
        var dsForm = DatasetFactory.getDataset("ds_form_leads_rh", null, [c2], null);
        
        var cardDataArray = [];
        var maxIndex = 0;

        // Reconstruir o array com todos os dados atuais (Pai e Filhos)
        if (dsForm != null && dsForm.rowsCount > 0) {
            var colNames = dsForm.getColumnsName();
            
            for (var i = 0; i < dsForm.rowsCount; i++) {
                var tablename = dsForm.getValue(i, "tablename");
                var isChild = (tablename != null && tablename != "");
                
                var sufixo = "";
                var rowId = dsForm.getValue(i, "id");
                
                // Se for um registo filho (linha da tabela), determina o sufixo "___X"
                if (isChild && rowId != null && rowId != "") {
                    sufixo = "_" + rowId;
                    var currentIndex = parseInt(rowId);
                    if (currentIndex > maxIndex) maxIndex = currentIndex;
                }

                for (var j = 0; j < colNames.length; j++) {
                    var colName = colNames[j];
                    // Ignorar colunas de controlo interno do Fluig
                    if (colName == "documentid" || colName == "version" || colName == "companyid" || colName == "cardid" || colName == "tablename" || colName == "id" || colName == "tableid") {
                        continue;
                    }

                    var val = dsForm.getValue(i, colName);
                    if (val != null && val != "") {
                        var finalFieldName = isChild ? (colName + sufixo) : colName;
                        
                        // Evitar duplicados (o Pai repete-se em cada linha no retorno do dataset)
                        var alreadyExists = false;
                        for (var k = 0; k < cardDataArray.length; k++) {
                            if (cardDataArray[k].field == finalFieldName) {
                                alreadyExists = true; break;
                            }
                        }
                        if (!alreadyExists) {
                            cardDataArray.push({ "field": finalFieldName, "value": val });
                        }
                    }
                }
            }
        }

        // 4. Calcular o Novo Índice e Regras de Negócio
        var nextIndex = maxIndex + 1;
        var scoreInt = parseInt(dadosObj.finalScore || "0");
        var maturidade = "RH Tradicional";
        if(scoreInt >= 40 && scoreInt < 75) maturidade = "RH em Transição";
        if(scoreInt >= 75) maturidade = "RH Digital Estratégico";
        var dataAtual = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date());

        // 5. Adicionar a Nova Linha (Lead) ao Array de Dados
        cardDataArray.push({"field": "tb_data_interacao___" + nextIndex, "value": dataAtual});
        cardDataArray.push({"field": "tb_empresa___" + nextIndex, "value": dadosObj.company_name || ""});
        cardDataArray.push({"field": "tb_nome_contato___" + nextIndex, "value": dadosObj.user_name || ""});
        cardDataArray.push({"field": "tb_email_contato___" + nextIndex, "value": email});
        cardDataArray.push({"field": "tb_telefone___" + nextIndex, "value": dadosObj.phone || ""});
        cardDataArray.push({"field": "tb_score_final___" + nextIndex, "value": scoreInt.toString()});
        cardDataArray.push({"field": "tb_nivel_maturidade___" + nextIndex, "value": maturidade});
        cardDataArray.push({"field": "tb_json_respostas___" + nextIndex, "value": jsonDados});

        // 6. Enviar a Atualização para a API do Fluig
        atualizarFormularioFluig(cardDocumentId, cardDataArray);
        
        dataset.addRow(new Array("SUCCESS", "Lead inserido com sucesso na linha " + nextIndex + ".", eventoId));
        log.info(">>> LEAD INSERIDO. Evento: " + eventoId + " | Index: " + nextIndex);

    } catch (e) {
        log.error(">>> ERRO AO INSERIR LEAD NO EVENTO: " + e.toString());
        dataset.addRow(new Array("ERROR", e.toString(), "0"));
    }

    return dataset;
}

// Função auxiliar que faz um POST interno para a API nativa do Fluig
function atualizarFormularioFluig(documentId, cardDataArray) {
    // Substituir pela URL base correta se necessário
    var url = "http://177.39.21.75:8080/api/public/2.0/cards/update/" + documentId;
    var client = new java.net.URL(url);
    var connection = client.openConnection();
    
    connection.setRequestMethod("PUT");
    connection.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
    connection.setRequestProperty("Accept", "application/json");

    // ?? ALTERE AQUI: Introduza o utilizador e senha de uma conta administrativa/integradora
    var userpass = "admin:senha_do_fluig";
    var basicAuth = "Basic " + java.util.Base64.getEncoder().encodeToString(new java.lang.String(userpass).getBytes("UTF-8"));
    connection.setRequestProperty("Authorization", basicAuth);

    connection.setDoOutput(true);
    var outputStream = connection.getOutputStream();

    // Monta o payload conforme a documentação da API do Fluig
    var payload = {
        "versioning": false, // Evita criar centenas de versões do documento físico
        "cardData": cardDataArray
    };

    var payloadString = JSON.stringify(payload);
    var input = new java.lang.String(payloadString).getBytes("UTF-8");
    outputStream.write(input, 0, input.length);
    outputStream.flush();
    outputStream.close();

    var responseCode = connection.getResponseCode();
    if (responseCode >= 200 && responseCode < 300) {
        return true;
    } else {
        // Tentar capturar a mensagem de erro da API
        var errorMsg = "";
        try {
            var scanner = new java.util.Scanner(connection.getErrorStream()).useDelimiter("\\A");
            errorMsg = scanner.hasNext() ? scanner.next() : "";
        } catch(ex) { errorMsg = "Sem detalhes adicionais."; }
        
        throw "Erro na API de Update de Card (" + responseCode + "): " + errorMsg;
    }
}
