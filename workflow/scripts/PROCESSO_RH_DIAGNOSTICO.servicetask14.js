function servicetask14(attempt, message) {
    log.info(">>> DIAGNOSTICO RH [ST14]: Iniciando disparo agendado do E-mail Nutrição 1");

    try {
        // Pega o e-mail preenchido na Landing Page
        var emailContato = hAPI.getCardValue("email_contato");
        
        // Trava de segurança: Se não tiver e-mail, encerra a tarefa silenciosamente sem travar o processo
        if (!emailContato || emailContato == "" || emailContato == "anonimo@teste.com") {
            log.info(">>> DIAGNOSTICO RH [ST14]: Email vazio ou anônimo. Disparo cancelado.");
            return true; 
        }

        // Pega os demais dados do formulário
        var nomeContato = hAPI.getCardValue("nome_contato");
        var empresa = hAPI.getCardValue("empresa");
        var maturidade = hAPI.getCardValue("nivel_maturidade");
        var scoreFinal = hAPI.getCardValue("score_final");

        var assuntoEmail = "Seu Diagnóstico RH - Próximos Passos";

        // Monta os parâmetros exatamente como você fez no afterProcessCreate
        var parametros = new java.util.HashMap();
        parametros.put("nomeContato", nomeContato);
        parametros.put("empresa", empresa);
        parametros.put("scoreFinal", scoreFinal);
        parametros.put("maturidade", maturidade);
        parametros.put("subject", assuntoEmail);
        
        // Adiciona o destinatário externo
        var destinatarios = new java.util.ArrayList();
        destinatarios.add(String(emailContato).trim());
        
        // Dispara usando o remetente válido que já mapeamos
        notifier.notify("guilherme-af", "TPL_NUTRICAO_1", parametros, destinatarios, "text/html");

        log.info(">>> DIAGNOSTICO RH [ST14]: E-mail de nutrição disparado com sucesso para " + emailContato);
        
        // Data e hora do disparo, no mesmo padrão de formatação usado no restante do projeto
        var dataHoraEnvio = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date());
        hAPI.setCardValue("status_email_1", "Enviado em " + dataHoraEnvio);
        
        return true;

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH [ST14]: ERRO FATAL NO ENVIO: " + e.toString());
        // Lança a exceção para que o Fluig jogue a tarefa para a bolinha de "Erro" (se houver) e não perca o rastro
        throw "Erro ao enviar e-mail agendado: " + e.toString();
    }
}