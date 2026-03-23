/**
 * Utilitário de Validação para o Diagnóstico RH
 */
var RHValidator = (function () {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return {
        validateStep: function (step, containerSelector, isTestMode) {
            if (isTestMode) return true;
            var $container = $(containerSelector);
            var isValid = true;

            // Reset visual
            $container.find(".form-control").css("border-color", "#ddd");
            $container.find(".form-group label").css("color", "");

            // Lógica por passo
            switch (step) {
                case 1: // Empresa
                    $container.find("input[required], select[required], input[placeholder*='*']").each(function () {
                        if ($(this).attr('id') === 'company_site') return;
                        if (!$(this).val()) { $(this).css("border-color", "#e74c3c"); isValid = false; }
                    });
                    var email = $container.find("#user_email").val();
                    if (email && !emailRegex.test(email)) { $container.find("#user_email").css("border-color", "#e74c3c"); isValid = false; }
                    break;

                case 2: // Recrutamento
                case 3: // Admissão
                case 4: // DP
                case 5: // T&D
                case 6: // Cultura
                case 7: // Analytics
                case 8: // Tecnologia
                    // Valida todos os radios visíveis
                    var radioGroups = {};
                    $container.find("input[type='radio']:visible").each(function () {
                        radioGroups[$(this).attr("name")] = true;
                    });
                    for (var name in radioGroups) {
                        if (!$container.find("input[name='" + name + "']:checked").val()) {
                            $container.find("input[name='" + name + "']").closest('.form-group').find('label').first().css("color", "#e74c3c");
                            isValid = false;
                        }
                    }
                    // Valida campos de texto obrigatórios visíveis
                    $container.find("input[type='text']:visible, select:visible").each(function () {
                        if ($(this).attr("placeholder") && $(this).attr("placeholder").indexOf("*") > -1 && !$(this).val()) {
                            $(this).css("border-color", "#e74c3c");
                            isValid = false;
                        }
                    });
                    break;
            }

            if (!isValid) this.showToast("Atenção", "Por favor, preencha todos os campos obrigatórios marcados em vermelho.", "warning");
            return isValid;
        },

        showToast: function (title, message, type) {
            if (typeof FLUIGC !== 'undefined' && FLUIGC.toast) {
                FLUIGC.toast({ title: title, message: message, type: type });
            }
        }
    };
})();