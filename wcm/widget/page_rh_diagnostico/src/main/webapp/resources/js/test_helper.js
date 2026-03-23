/**
 * Utilitário para facilitar testes do Diagnóstico RH
 */
var RHTestHelper = (function () {
    return {
        fill: function (type) {
            var widget = RHDiagnostico.instance();
            var data = {
                company_name: "Empresa Teste " + type.toUpperCase(),
                company_segment: "servicos",
                company_size: "51-200",
                rh_team_size: "3-5",
                user_name: "Analista Prova",
                user_email: "diagnostico@interhativa.com.br",
                user_role: "rh",
                dp_system: "Sistema Global Pro",
                payroll_responsible: "interna",
                indicator_tools: "Dashboard de Performance"
            };

            var pillars = [
                'process_formal', 'use_ats', 'dedicated_team',
                'has_digital_admission', 'use_admission_portal', 'has_electronic_signature', 'has_integration_program', 'is_admission_secure',
                'dp_automated', 'esocial_compliant',
                'has_action_plan', 'has_leadership_training', 'has_feedback_culture', 'has_custom_training',
                'culture_alignment', 'expression_freedom', 'people_valuation', 'defined_hierarchy',
                'has_rh_indicators', 'performance_evaluation', 'has_roi_view',
                'use_ai_rh', 'integrated_data', 'payroll_cloud', 'total_integration', 'full_resource_usage'
            ];

            pillars.forEach(function (p) {
                if (type === 'digital') data[p] = 'sim';
                else if (type === 'tradicional') data[p] = 'nao';
                else data[p] = Math.random() > 0.5 ? 'sim' : 'nao';
            });

            widget.userAnswers = data;
            widget.isTestMode = true;

            if (typeof FLUIGC !== 'undefined') {
                FLUIGC.toast({ message: 'Perfil "' + type + '" simulado com sucesso.', type: 'info' });
            }

            if ($("#landing-intro").is(":visible")) {
                $("#consent_privacy_" + widget.instanceId).prop("checked", true).trigger("change");
                widget.startFlow();
            } else {
                widget.renderStep();
            }
        }
    };
})();