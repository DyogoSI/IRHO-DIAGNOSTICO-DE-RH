function afterTaskSave(colleagueId, nextSequenceId, userList) {
    var atividadeAtual = getValue("WKNumState");
    var numSolicitacao = getValue("WKNumProces");

    log.info("### DIAGNOSTICO RH [" + numSolicitacao + "]: Iniciando afterTaskSave. Atv Atual: " + atividadeAtual + " -> Destino: " + nextSequenceId);

    // =========================================================================
    // DISPARO DE E-MAIL NA ATIVIDADE "NUTRIÇÃO 1" (Atividade 5)
    // =========================================================================
    
    // Regra 1: Disparar quando a equipe comercial SALVAR/CONCLUIR a Nutrição 1
    if (atividadeAtual == 5) {
        log.info("### DIAGNOSTICO RH [" + numSolicitacao + "]: Finalizando Nutrição 1. Disparando e-mail.");
        try {
            enviarEmailNutricao(numSolicitacao);
        } catch (e) {
            log.error("### DIAGNOSTICO RH: Erro ao disparar e-mail de Nutrição 1: " + e);
        }
    }

    // Regra 2 (Alternativa): Se você quiser que o e-mail dispare SOZINHO 
    // no momento exato em que a solicitação CHEGAR na caixa de entrada da Nutrição 1,
    // comente o bloco acima e descomente o bloco abaixo:
    /*
    if (nextSequenceId == 5) {
        log.info("### DIAGNOSTICO RH [" + numSolicitacao + "]: O processo chegou na Nutrição 1. Disparando e-mail.");
        try {
            enviarEmailNutricao(numSolicitacao);
        } catch (e) {
            log.error("### DIAGNOSTICO RH: Erro ao disparar e-mail ao chegar na Nutrição 1: " + e);
        }
    }
    */
}

// =============================================================================
// FUNÇÃO AUXILIAR DE ENVIO DE E-MAIL (Usando API Nativa do Fluig)
// =============================================================================
function enviarEmailNutricao(numSolicitacao) {
    // 1. Coleta os dados que foram salvos no Formulário pelo Widget
    var nomeContato = hAPI.getCardValue("nome_contato");
    var emailDestino = hAPI.getCardValue("email_contato");
    var empresa = hAPI.getCardValue("empresa");
    var scoreFinal = hAPI.getCardValue("score_final");
    var maturidade = hAPI.getCardValue("nivel_maturidade");
    var linkPdfPublico = hAPI.getCardValue("link_pdf_publico");

    // 2. Valida se o candidato preencheu o e-mail
    if (emailDestino != null && String(emailDestino).trim() != "") {
        var emailLimpo = String(emailDestino).trim();

        // 3. Monta as variáveis que serão injetadas dentro do seu Template HTML
        var parametros = new java.util.HashMap();
        parametros.put("NOME_CONTATO", nomeContato);
        parametros.put("EMPRESA", empresa);
        parametros.put("SCORE_FINAL", scoreFinal);
        parametros.put("MATURIDADE", maturidade);
        parametros.put("LINK_PDF", linkPdfPublico);
        
        // Assunto do E-mail
        parametros.put("subject", "Resultados do Diagnóstico de Maturidade RH - " + empresa);

        // 4. Prepara a lista de destinatários
        var destinatarios = new java.util.ArrayList();
        destinatarios.add(emailLimpo);

        // 5. Aciona o Notifier do Fluig.
        // IMPORTANTE: Mude "TPL_DIAGNOSTICO_RESULTADO" para o ID exato do seu template cadastrado no Fluig
        var templateId = "TPL_DIAGNOSTICO_RESULTADO"; 
        
        // Remetente padrão do sistema (pode colocar a matricula do vendedor "guilherme-af" se preferir)
        var remetente = "guilherme-af"; 

        notifier.notify(remetente, templateId, parametros, destinatarios, "text/html");

        log.info("### DIAGNOSTICO RH [" + numSolicitacao + "]: E-mail disparado com sucesso para " + emailLimpo);
    } else {
        log.warn("### DIAGNOSTICO RH [" + numSolicitacao + "]: E-mail de destino vazio. Disparo cancelado.");
    }
}