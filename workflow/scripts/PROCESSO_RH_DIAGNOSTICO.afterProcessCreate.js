function afterProcessCreate(processId) {
    log.info(">>> DIAGNOSTICO RH: Iniciando disparo de email customizado. Processo ID: " + processId);

    try {
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
            
            notifier.notify(remetente, idTemplate, parametros, destinatarios, "text/html");

            log.info(">>> DIAGNOSTICO RH: E-mail enviado com sucesso!");

        } else {
            log.warn(">>> DIAGNOSTICO RH: E-mail não preenchido ou é anônimo. Envio cancelado.");
        }

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH: ERRO FATAL AO ENVIAR EMAIL: " + e);
        log.error(e.toString());
    }
}