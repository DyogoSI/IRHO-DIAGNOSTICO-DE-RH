function getValueOrDefault(value, defaultValue) {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    var str = String(value);
    return str && str.trim() ? str.trim() : defaultValue;
}

function getConstraintValue(constraints, fieldName) {
    if (!constraints || !constraints.length) {
        return '';
    }
    for (var i = 0; i < constraints.length; i++) {
        var constraint = constraints[i];
        if (!constraint) continue;

        var constraintField = String(constraint.fieldName || constraint._field || constraint.name || '');

        if (constraintField === String(fieldName)) {
            return getValueOrDefault(
                constraint.initialValue !== undefined ? constraint.initialValue : constraint._initialValue,
                ''
            );
        }
    }
    return '';
}

function readPayload(constraints) {
    // Lê as variáveis enviadas pela Widget (Landing Page) ou via payload JSON
    var payloadConstraints = {
        emailContato: getConstraintValue(constraints, 'emailContato'),
        nomeContato: getConstraintValue(constraints, 'nomeContato'),
        empresa: getConstraintValue(constraints, 'empresa'),
        scoreFinal: getConstraintValue(constraints, 'scoreFinal'),
        maturidade: getConstraintValue(constraints, 'maturidade'),
        linkPdfPublico: getConstraintValue(constraints, 'linkPdfPublico'),
        id_pdf_diagnostico: getConstraintValue(constraints, 'id_pdf_diagnostico') // Adicionado para buscar o ID do anexo
    };

    return payloadConstraints;
}

function buildParametrosNotifier(payload) {
    var parametros = new java.util.HashMap();
    var dataAtual = new java.text.SimpleDateFormat("dd/MM/yyyy").format(new java.util.Date());
    
    // Assunto dinâmico
    var assuntoEmail = "📊 Resultado: A maturidade do RH da " + getValueOrDefault(payload.empresa, "sua empresa") + " é " + getValueOrDefault(payload.maturidade, "");

    // Injeta as variáveis esperadas pelo Template Fluig (TPL_DIAGNOSTICO_RESULTADO)
    parametros.put("subject", assuntoEmail);
    parametros.put("nomeContato", getValueOrDefault(payload.nomeContato, "Profissional de RH"));
    parametros.put("empresa", getValueOrDefault(payload.empresa, "Sua Empresa"));
    parametros.put("scoreFinal", getValueOrDefault(payload.scoreFinal, "0"));
    parametros.put("maturidade", getValueOrDefault(payload.maturidade, "Em análise"));
    parametros.put("linkPdfPublico", getValueOrDefault(payload.linkPdfPublico, ""));
    parametros.put("dataAtual", dataAtual);

    return parametros;
}

function sendEmailViaNotifier(payload) {
    // Configurações fixas do Diagnóstico RH
    var remetente = "guilherme-af";
    var template = "TPL_DIAGNOSTICO_RESULTADO";

    var parametros = buildParametrosNotifier(payload);
    
    var destinatarios = new java.util.ArrayList();
    var emailDestino = getValueOrDefault(payload.emailContato, "");
    
    // Trava de segurança: só envia se houver e-mail válido
    if (emailDestino && emailDestino !== "anonimo@teste.com") {
        destinatarios.add(emailDestino);
        // Dispara o e-mail via API interna do Fluig
        notifier.notify(remetente, template, parametros, destinatarios, "text/html");
        return true;
    } else {
        throw "Email de contacto inválido ou anónimo: " + emailDestino;
    }
}

function buildDebugPayload(payload) {
    return [
        'nome=' + getValueOrDefault(payload.nomeContato, ''),
        'empresa=' + getValueOrDefault(payload.empresa, ''),
        'email=' + getValueOrDefault(payload.emailContato, ''),
        'score=' + getValueOrDefault(payload.scoreFinal, ''),
        'maturidade=' + getValueOrDefault(payload.maturidade, '')
    ].join(' | ');
}

function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn('success');
    dataset.addColumn('message');
    dataset.addColumn('recipient');
    dataset.addColumn('subject');
    dataset.addColumn('sentAt');
    dataset.addColumn('debugPayload');

    try {
        var payload = readPayload(constraints);

        // ==========================================================
        // A MÁGICA DO LINK PÚBLICO
        // Se veio o ID do PDF, mas o link veio vazio, geramos o link aqui:
        // ==========================================================
        if (!payload.linkPdfPublico && payload.id_pdf_diagnostico) {
            try {
                var docService = fluigAPI.getDocumentService();
                payload.linkPdfPublico = String(docService.getDownloadURL(parseInt(payload.id_pdf_diagnostico, 10)));
                log.info(">>> DIAGNOSTICO RH [DATASET]: Link publico gerado via API: " + payload.linkPdfPublico);
            } catch (e) {
                log.warn(">>> DIAGNOSTICO RH [DATASET]: Falha ao gerar link publico do GED: " + e);
            }
        }

        // Tenta enviar o email
        sendEmailViaNotifier(payload);

        // Se passar direto, deu Sucesso
        dataset.addRow([
            'true',
            'E-mail do Diagnóstico enviado com sucesso ao Notifier do Fluig.',
            getValueOrDefault(payload.emailContato, ''),
            'Resultado do Diagnostico RH',
            new Date().toISOString(),
            buildDebugPayload(payload)
        ]);

    } catch (e) {
        // Se der erro, captura sem quebrar a tela do utilizador e gera log
        dataset.addRow([
            'false',
            String(e && e.message ? e.message : e),
            getValueOrDefault(getConstraintValue(constraints, 'emailContato'), 'N/A'),
            'Falha no envio - Resultado do Diagnostico RH',
            String(new java.util.Date()),
            ''
        ]);
        
        log.error(">>> DIAGNOSTICO RH [DATASET EMAIL]: Erro no envio - " + e.toString());
    }

    return dataset;
}