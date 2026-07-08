function servicetask28(attempt, message) {
    log.info(">>> DIAGNOSTICO RH [ST28]: Iniciando disparo agendado do E-mail Nutrição 3");

    try {
        var emailContato = hAPI.getCardValue("email_contato");
        
        // Trava de segurança
        if (!emailContato || emailContato == "" || emailContato == "anonimo@teste.com") {
            log.info(">>> DIAGNOSTICO RH [ST28]: Email vazio ou anônimo. Disparo cancelado.");
            return true; 
        }

        var nomeContato = hAPI.getCardValue("nome_contato");
        var empresa = hAPI.getCardValue("empresa");
        var maturidade = hAPI.getCardValue("nivel_maturidade");
        var scoreFinal = hAPI.getCardValue("score_final");

        // Assunto específico para a nutrição 3
        var assuntoEmail = "Vamos transformar o RH da " + empresa + "?";

        var parametros = new java.util.HashMap();
        parametros.put("nomeContato", nomeContato);
        parametros.put("empresa", empresa);
        parametros.put("scoreFinal", scoreFinal);
        parametros.put("maturidade", maturidade);
        parametros.put("subject", assuntoEmail);
        
        var destinatarios = new java.util.ArrayList();
        destinatarios.add(String(emailContato).trim());
        
        // Dispara chamando o Template 3
        notifier.notify("guilherme-af", "TPL_NUTRICAO_3", parametros, destinatarios, "text/html");

        log.info(">>> DIAGNOSTICO RH [ST28]: E-mail de nutrição 3 disparado com sucesso para " + emailContato);
        
        // Data e hora do disparo, no mesmo padrão de formatação usado no restante do projeto
        var dataHoraEnvio = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date());
        hAPI.setCardValue("status_email_3", "Enviado em " + dataHoraEnvio);
        
        return true;

    } catch (e) {
        log.error(">>> DIAGNOSTICO RH [ST28]: ERRO FATAL NO ENVIO: " + e.toString());
        throw "Erro ao enviar e-mail 3 agendado: " + e.toString();
    }
}