function displayFields(form, customHTML) {
    // 1. Pega o estado e o modo nativamente do servidor do Fluig
    var mode = form.getFormMode();
    var state = getValue("WKNumState");
    
    // Trata o número da atividade
    state = (state != null && state != "") ? parseInt(state) : 0;

    // 2. Injeta essas informações como variáveis globais no HTML antes de o ecrã carregar
    customHTML.append("<script>");
    customHTML.append("var SERVER_MODE = '" + mode + "';\n");
    customHTML.append("var SERVER_STATE = " + state + ";\n");
    customHTML.append("</script>");
}