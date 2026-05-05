var RHDiagnostico = SuperWidget.extend({
    currentStep: 1,
    isTestMode: false,
    userAnswers: {},
    myChart: null,
    isNavigating: false,
    finalClassification: "",
    finalScoreGlobal: 0,
    chosenInsights: [], 
    chosenOpportunities: [], 

    authConfig: {
        url: 'http://177.39.21.75:8080',
        consumerKey: 'integracao_widget_diagnostico',
        consumerSecret: 's3cr3t_key_1nt_w1dt_0384183',
        token: '7e4f7fdb-b394-4385-8a88-95a87d475f41',
        tokenSecret: '9e9dcd7e-c8d2-4dd7-a69d-5f5083b9e2c0ec33ebf8-fa20-4ded-9376-0885093c95cf'
    },

    init: function () {
        this.currentStep = 1;
        this.userAnswers = {};
        this.isNavigating = false;
        
        if ($("#tech-animations-css").length === 0) {
            var techCss = "" +
                "@keyframes techPulseGlow { " +
                "  0% { transform: scale(0.95); opacity: 0; box-shadow: 0 0 0 rgba(30, 170, 217, 0); } " +
                "  50% { transform: scale(1.02); opacity: 1; box-shadow: 0 10px 40px rgba(30, 170, 217, 0.4); } " +
                "  100% { transform: scale(1); opacity: 1; box-shadow: 0 5px 20px rgba(30, 170, 217, 0.15); } " +
                "} " +
                ".vibrant-tech-entrance { " +
                "  animation: techPulseGlow 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; " +
                "} " +
                ".score-pop { " +
                "  transform: scale(1.3); " +
                "  color: #f39c12 !important; " +
                "  text-shadow: 0 0 15px rgba(243, 156, 18, 0.6); " +
                "  transition: all 0.3s ease-out; " +
                "}";
            $("<style id='tech-animations-css'>")
                .prop("type", "text/css")
                .html(techCss)
                .appendTo("head");
        }

        this.bindings();
    },

    bindings: function () {
        var that = this;
        var $dom = $(this.DOM);

        $dom.off(".rhDiag");

        $dom.on("change.rhDiag", "[data-privacy-check]", function () {
            $dom.find("[data-start-quiz]").prop("disabled", !$(this).is(":checked"));
        });

        $dom.on("click.rhDiag", "[data-start-quiz]", function (e) {
            e.preventDefault();
            if (that.isNavigating) return;
            that.startFlow();
        });
        
        $dom.on("click.rhDiag", "[data-next-step]", function (e) {
            e.preventDefault();
            if (that.isNavigating) return;
            that.processNextStep();
        });
        
        $dom.on("click.rhDiag", "[data-prev-step]", function (e) {
            e.preventDefault();
            if (that.isNavigating) return;
            that.processPrevStep();
        });

        $dom.on("input.rhDiag change.rhDiag", "#company_name, #user_name, #user_email", function() {
            $(this).css({"border-color": "", "box-shadow": ""});
        });

        $dom.on("change.rhDiag", "input[name='use_ats']", function () {
            $(this).val() === "sim" ? $("#ats-name-container").slideDown() : $("#ats-name-container").slideUp();
        });
        
        $dom.on("change.rhDiag", "input[name='has_digital_admission']", function () {
            $(this).val() === "sim" ? $(".conditional-admission").slideDown() : $(".conditional-admission").slideUp();
        });

        $dom.on("click.rhDiag", "#btn-add-phone", function (e) {
            e.preventDefault();
            $("#phone-container").append('<div class="phone-input-group mt-2" style="display:flex; gap:5px;"><input type="tel" class="form-control phone-field" placeholder="(00) 00000-0000"><button type="button" class="btn btn-danger btn-xs remove-phone">X</button></div>');
        });
        
        $dom.on("click.rhDiag", ".remove-phone", function (e) {
            e.preventDefault();
            $(this).parent().remove();
        });

        $dom.on("click.rhDiag", "#btn-whatsapp", function (e) {
            e.preventDefault();
            that.sendToWhatsApp();
        });
    },

    startFlow: function () {
        var that = this;
        this.isNavigating = true;

        $("#landing-intro").fadeOut(300, function() {
            $("#landing-quiz").fadeIn(300);
            that.currentStep = 1;
            that.renderStep();
            that.isNavigating = false;
        });
    },

    processNextStep: function () {
        this.isNavigating = true;

        if (this.currentStep === 1) {
            var isValid = true;
            var requiredFields = ['#company_name', '#user_name', '#user_email'];
            
            requiredFields.forEach(function(selector) {
                var $input = $(selector);
                if (!$input.val() || $input.val().trim() === "") {
                    $input.css({"border-color": "#e74c3c", "box-shadow": "0 0 5px rgba(231, 76, 60, 0.4)"});
                    isValid = false;
                } else {
                    $input.css({"border-color": "", "box-shadow": ""});
                }
            });

            if (!isValid) {
                this.isNavigating = false;
                return;
            }
        }

        this.next();
    },

    next: function () {
        var that = this;
        this.saveCurrentData();
        if (this.currentStep === 8) {
            this.showResult();
        } else {
            this.currentStep++;
            this.renderStep();
        }
        
        setTimeout(function() { that.isNavigating = false; }, 400);
    },

    processPrevStep: function () {
        var that = this;
        this.isNavigating = true;
        if (this.currentStep > 1) {
            this.saveCurrentData();
            this.currentStep--;
            this.renderStep();
        }
        setTimeout(function() { that.isNavigating = false; }, 400);
    },

    saveCurrentData: function () {
        var that = this;
        $("#step-content-container").find("input, select, textarea").each(function () {
            var name = $(this).attr("name") || $(this).attr("id");
            if (name && name !== "telefone") {
                if ($(this).is(":radio")) {
                    if ($(this).is(":checked")) {
                        that.userAnswers[name] = $(this).val();
                    }
                } else {
                    that.userAnswers[name] = $(this).val();
                }
            }
        });

        if (this.currentStep === 1) {
            var phones = [];
            $("#step-content-container").find(".phone-field").each(function() {
                var val = $(this).val().trim();
                if (val) phones.push(val);
            });
            that.userAnswers['telefone'] = phones.length > 0 ? phones.join(" / ") : "";
        }
    },

    renderStep: function () {
        var that = this;
        var $container = $("#step-content-container");

        $(".step-item").removeClass("active completed").each(function (i) {
            if (i + 1 < that.currentStep) $(this).addClass("completed");
            else if (i + 1 === that.currentStep) $(this).addClass("active");
        });

        $("#btn-prev-step").css("visibility", this.currentStep === 1 ? "hidden" : "visible");
        $("#btn-next-step").html(this.currentStep === 8 ? '<span>Finalizar Diagnóstico</span> <i class="flaticon flaticon-chevron-right icon-sm"></i>' : '<span>Próximo Passo</span> <i class="flaticon flaticon-chevron-right icon-sm"></i>');

        switch (this.currentStep) {
            case 1: this.renderEmpresa($container); break;
            case 2: this.renderRecrutamento($container); break;
            case 3: this.renderAdmissao($container); break;
            case 4: this.renderDP($container); break;
            case 5: this.renderTD($container); break;
            case 6: this.renderCultura($container); break;
            case 7: this.renderAnalytics($container); break;
            case 8: this.renderTecnologia($container); break;
        }
        
        this.restoreData();

        if (this.currentStep === 1 && this.userAnswers['telefone']) {
            var phonesArray = this.userAnswers['telefone'].split(" / ");
            var $phoneContainer = $("#phone-container");
            $phoneContainer.empty();
            
            phonesArray.forEach(function(phone, index) {
                if (index === 0) {
                    $phoneContainer.append('<div class="phone-input-group"><input type="tel" class="form-control phone-field" placeholder="(00) 00000-0000" value="'+phone+'"><button type="button" id="btn-add-phone" class="btn-add-phone">+</button></div>');
                } else {
                    $phoneContainer.append('<div class="phone-input-group mt-2" style="display:flex; gap:5px;"><input type="tel" class="form-control phone-field" placeholder="(00) 00000-0000" value="'+phone+'"><button type="button" class="btn btn-danger btn-xs remove-phone">X</button></div>');
                }
            });
        }

        if (window.innerWidth <= 768) {
            $('html, body').animate({
                scrollTop: $(".content-box").offset().top - 80 
            }, 300);
        }
    },

    restoreData: function () {
        var that = this;
        $.each(this.userAnswers, function (k, v) {
            var $el = $("[name='" + k + "'], #" + k);
            if ($el.length && k !== 'telefone') {
                if ($el.is(":radio")) {
                    $("[name='" + k + "'][value='" + v + "']").prop("checked", true);
                    if (k === 'use_ats' || k === 'has_digital_admission') {
                        $("[name='" + k + "'][value='" + v + "']").trigger("change.rhDiag");
                    }
                } else {
                    $el.val(v);
                }
            }
        });
    },

    renderEmpresa: function ($c) { $c.html('<div class="row"><div class="col-md-6"><h4 class="form-section-title">Dados da Empresa</h4><div class="form-group"><label>Empresa*</label><input type="text" id="company_name" name="company_name" class="form-control" placeholder="Nome da sua empresa"></div><div class="form-group"><label>Segmento</label><select id="company_segment" name="company_segment" class="form-control"><option value="">Selecione...</option><option value="industria">Indústria</option><option value="comercio">Comércio</option><option value="servicos">Serviços</option><option value="tecnologia">Tecnologia</option><option value="outros">Outros</option></select></div><div class="form-group"><label>Número de Funcionários</label><select id="company_size" name="company_size" class="form-control"><option value="0-50">De 0 a 50</option><option value="51-200">51 a 200</option><option value="201-500">201 a 500</option><option value="501+">Mais de 500</option></select></div><div class="form-group"><label>Site</label><input type="text" id="company_site" name="company_site" class="form-control" placeholder="www.suaempresa.com.br"></div><div class="form-group"><label>Pessoas no RH atualmente?</label><select id="rh_team_size" name="rh_team_size" class="form-control"><option value="1-2">1 a 2</option><option value="3-5">3 a 5</option><option value="6+">Mais de 5</option></select></div></div><div class="col-md-6"><h4 class="form-section-title">Identificação do Contato</h4><div class="form-group"><label>Seu Nome*</label><input type="text" id="user_name" name="user_name" class="form-control"></div><div class="form-group"><label>Email Corporativo*</label><input type="email" id="user_email" name="user_email" class="form-control"></div><div class="form-group"><label>Telefone(s)</label><div id="phone-container"><div class="phone-input-group"><input type="tel" class="form-control phone-field" placeholder="(00) 00000-0000"><button type="button" id="btn-add-phone" class="btn-add-phone">+</button></div></div></div><div class="form-group"><label>Seu Cargo / Setor</label><select id="user_role" name="user_role" class="form-control"><option value="rh">Gestor de RH / DP</option><option value="analista_rh">Analista de RH</option><option value="ti">TI / Tecnologia</option><option value="ceo">Diretoria / CEO</option><option value="outros">Outros</option></select></div></div></div>'); },
    renderRecrutamento: function ($c) { $c.html('<h4 class="form-section-title">Recrutamento e Seleção</h4><div class="form-group mb-4"><label>Sua empresa possui um processo formal e documentado de recrutamento e seleção?</label><div class="radio-group mt-2"><label><input type="radio" name="process_formal" value="sim"> Sim</label><label><input type="radio" name="process_formal" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Utiliza plataforma de ATS (Applicant Tracking System) para gerir o processo?</label><div class="radio-group mt-2"><label><input type="radio" name="use_ats" value="sim"> Sim</label><label><input type="radio" name="use_ats" value="nao"> Não</label></div></div><div id="ats-name-container" style="display:none;"><label>Qual plataforma de ATS utiliza?</label><input type="text" id="ats_name" name="ats_name" class="form-control" placeholder="Ex: Gupy, Kenoby, Sólides..."></div><div class="form-group mt-4"><label>Em quais canais as vagas são divulgadas atualmente?</label><input type="text" id="job_channels" name="job_channels" class="form-control" placeholder="LinkedIn, Vagas.com, Facebook..."></div><div class="form-group mt-4"><label>Possui equipe destinada apenas para R&S?</label><div class="radio-group mt-2"><label><input type="radio" name="dedicated_team" value="sim"> Sim</label><label><input type="radio" name="dedicated_team" value="nao"> Não</label></div></div><div class="form-group mt-4"><label>Volume médio de contratações por mês?</label><select id="hiring_volume" name="hiring_volume" class="form-control"><option value="1-10">1 a 10</option><option value="11-20">11 a 20</option><option value="20+">Mais de 20</option></select></div>'); },
    renderAdmissao: function ($c) { $c.html('<h4 class="form-section-title">Admissão e Onboarding</h4><div class="form-group mb-4"><label>O processo de Admissão é feito de forma digital?</label><div class="radio-group mt-2"><label><input type="radio" name="has_digital_admission" value="sim"> Sim</label><label><input type="radio" name="has_digital_admission" value="nao"> Não</label></div></div><div class="conditional-admission" style="display:none;"><div class="form-group mb-4"><label>Utiliza Portal para o candidato enviar documentos (Pré-admissão)?</label><div class="radio-group mt-2"><label><input type="radio" name="use_admission_portal" value="sim"> Sim</label><label><input type="radio" name="use_admission_portal" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Possui Assinatura Eletrônica de contratos?</label><div class="radio-group mt-2"><label><input type="radio" name="has_electronic_signature" value="sim"> Sim</label><label><input type="radio" name="has_electronic_signature" value="nao"> Não</label></div></div></div><div class="form-group mb-4"><label>Os novos colaboradores passam por um programa de integração estruturado(onboarding)?</label><div class="radio-group mt-2"><label><input type="radio" name="has_integration_program" value="sim"> Sim</label><label><input type="radio" name="has_integration_program" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Considera o processo de admissão atual seguro contra fraudes?</label><div class="radio-group mt-2"><label><input type="radio" name="is_admission_secure" value="sim"> Sim</label><label><input type="radio" name="is_admission_secure" value="nao"> Não</label></div></div>'); },
    renderDP: function ($c) { $c.html('<h4 class="form-section-title">Departamento Pessoal</h4><div class="form-group mb-4"><label>Qual o sistema ERP/Folha utilizado atualmente?</label><input type="text" id="dp_system" name="dp_system" class="form-control" placeholder="Ex: TOTVS RM, Protheus, Senior..."></div><div class="form-group mb-4"><label>Quem é o responsável pelo processamento da folha?</label><select id="payroll_responsible" name="payroll_responsible" class="form-control"><option value="interna">Equipe interna</option><option value="terceirizada">Contabilidade Terceirizada</option><option value="bpo">BPO de Folha</option><option value="outros">Outros</option></select></div><div class="form-group mb-4"><label>Os processos de solicitação de férias/benefícios são automatizados?</label><div class="radio-group mt-2"><label><input type="radio" name="dp_automated" value="sim"> Sim</label><label><input type="radio" name="dp_automated" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>A empresa atende a todas as exigências do eSocial sem processos manuais?</label><div class="radio-group mt-2"><label><input type="radio" name="esocial_compliant" value="sim"> Sim</label><label><input type="radio" name="esocial_compliant" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Utiliza planilhas como ferramentas auxiliares nos processos de Folha?</label><div class="radio-group mt-2"><label><input type="radio" name="use_sheets_payroll" value="sim"> Sim</label><label><input type="radio" name="use_sheets_payroll" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existem fluxos de trabalho definidos para cada atividade do DP?</label><div class="radio-group mt-2"><label><input type="radio" name="defined_dp_workflows" value="sim"> Sim</label><label><input type="radio" name="defined_dp_workflows" value="nao"> Não</label></div></div>'); },
    renderTD: function ($c) { $c.html('<h4 class="form-section-title">Treinamento e Desenvolvimento</h4><div class="form-group mb-4"><label>A empresa possui uma estratégia clara de desenvolvimento de pessoas?</label><div class="radio-group mt-2"><label><input type="radio" name="td_strategy_clear" value="sim"> Sim</label><label><input type="radio" name="td_strategy_clear" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Os treinamentos estão alinhados aos objetivos estratégicos da empresa?</label><div class="radio-group mt-2"><label><input type="radio" name="td_aligned_goals" value="sim"> Sim</label><label><input type="radio" name="td_aligned_goals" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existe planejamento anual de capacitação?</label><div class="radio-group mt-2"><label><input type="radio" name="td_annual_planning" value="sim"> Sim</label><label><input type="radio" name="td_annual_planning" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>A Alta Gestão participa da definição dos treinamentos?</label><div class="radio-group mt-2"><label><input type="radio" name="td_management_participation" value="sim"> Sim</label><label><input type="radio" name="td_management_participation" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existem indicadores ou avaliações que mostram onde estão as lacunas de competência?</label><div class="radio-group mt-2"><label><input type="radio" name="td_gap_indicators" value="sim"> Sim</label><label><input type="radio" name="td_gap_indicators" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Os líderes contribuem com informações sobre as necessidades de capacitação?</label><div class="radio-group mt-2"><label><input type="radio" name="td_leaders_contribution" value="sim"> Sim</label><label><input type="radio" name="td_leaders_contribution" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existem indicadores para avaliar o impacto dos treinamentos na performance?</label><div class="radio-group mt-2"><label><input type="radio" name="td_impact_indicators" value="sim"> Sim</label><label><input type="radio" name="td_impact_indicators" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existe correlação entre treinamento e melhoria de resultados da empresa?</label><div class="radio-group mt-2"><label><input type="radio" name="td_results_correlation" value="sim"> Sim</label><label><input type="radio" name="td_results_correlation" value="nao"> Não</label></div></div>'); },
    renderCultura: function ($c) { $c.html('<h4 class="form-section-title">Cultura Organizacional</h4><div class="form-group mb-4"><label>As ações do dia a dia são condizentes com a cultura divulgada?</label><div class="radio-group mt-2"><label><input type="radio" name="culture_alignment" value="sim"> Sim</label><label><input type="radio" name="culture_alignment" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Há liberdade e canais seguros para expressão de ideias?</label><div class="radio-group mt-2"><label><input type="radio" name="expression_freedom" value="sim"> Sim</label><label><input type="radio" name="expression_freedom" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>A cultura é centrada na valorização das pessoas?</label><div class="radio-group mt-2"><label><input type="radio" name="people_valuation" value="sim"> Sim</label><label><input type="radio" name="people_valuation" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>A estrutura de cargos, salários e hierarquias é clara?</label><div class="radio-group mt-2"><label><input type="radio" name="defined_hierarchy" value="sim"> Sim</label><label><input type="radio" name="defined_hierarchy" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Como os novos colaboradores são introduzidos à cultura organizacional?</label><input type="text" id="culture_intro" name="culture_intro" class="form-control" placeholder="Descreva brevemente..."></div><div class="form-group mb-4"><label>Realiza pesquisa de clima organizacional?</label><div class="radio-group mt-2"><label><input type="radio" name="climate_survey" value="sim"> Sim</label><label><input type="radio" name="climate_survey" value="nao"> Não</label></div></div>'); },
    renderAnalytics: function ($c) { $c.html('<h4 class="form-section-title">Indicadores e Analytics</h4><div class="form-group mb-4"><label>O RH possui indicadores (turnover, absenteísmo, tempo médio de contratação, etc.) e são acompanhados?</label><div class="radio-group mt-2"><label><input type="radio" name="has_rh_indicators" value="sim"> Sim</label><label><input type="radio" name="has_rh_indicators" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>O RH utiliza dashboards para auxílio na tomada de decisão?</label><div class="radio-group mt-2"><label><input type="radio" name="use_dashboards" value="sim"> Sim</label><label><input type="radio" name="use_dashboards" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Realiza a análise de custo por colaborador e por área?</label><div class="radio-group mt-2"><label><input type="radio" name="cost_per_employee" value="sim"> Sim</label><label><input type="radio" name="cost_per_employee" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Quais ferramentas usa para indicadores?</label><input type="text" id="indicator_tools" name="indicator_tools" class="form-control" placeholder="PowerBI, Excel, GoodData, Sistema próprio..."></div><div class="form-group mb-4"><label>Existe integração dos indicadores de RH com os indicadores estratégicos da empresa?</label><div class="radio-group mt-2"><label><input type="radio" name="indicators_integration" value="sim"> Sim</label><label><input type="radio" name="indicators_integration" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existe um processo estruturado de avaliação de desempenho (360º, metas, competências)?</label><div class="radio-group mt-2"><label><input type="radio" name="structured_performance_eval" value="sim"> Sim</label><label><input type="radio" name="structured_performance_eval" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existe acompanhamento da produtividade por área ou função?</label><div class="radio-group mt-2"><label><input type="radio" name="productivity_tracking" value="sim"> Sim</label><label><input type="radio" name="productivity_tracking" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>O custo de benefícios é comparado com o nível de satisfação dos colaboradores? E com a produtividade?</label><div class="radio-group mt-2"><label><input type="radio" name="benefits_cost_comparison" value="sim"> Sim</label><label><input type="radio" name="benefits_cost_comparison" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Existe análise de custo de rotatividade (contratação, desligamento, treinamento, afastamento)?</label><div class="radio-group mt-2"><label><input type="radio" name="turnover_cost_analysis" value="sim"> Sim</label><label><input type="radio" name="turnover_cost_analysis" value="nao"> Não</label></div></div>'); },
    renderTecnologia: function ($c) { $c.html('<h4 class="form-section-title">Tecnologia e Inovação</h4><div class="form-group mb-4"><label>Já utiliza Inteligência Artificial (IA) nos processos de RH?</label><div class="radio-group mt-2"><label><input type="radio" name="use_ai_rh" value="sim"> Sim</label><label><input type="radio" name="use_ai_rh" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Os dados organizacionais estão integrados com as demais áreas da empresa e sistemas?</label><div class="radio-group mt-2"><label><input type="radio" name="integrated_data" value="sim"> Sim</label><label><input type="radio" name="integrated_data" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>A folha de pagamento e documentos estão armazenados em nuvem?</label><div class="radio-group mt-2"><label><input type="radio" name="payroll_cloud" value="sim"> Sim</label><label><input type="radio" name="payroll_cloud" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Utiliza alguma consultoria especializada para apoiar nas demandas de RH?</label><div class="radio-group mt-2"><label><input type="radio" name="use_hr_consultancy" value="sim"> Sim</label><label><input type="radio" name="use_hr_consultancy" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Sua equipe utiliza todos os recursos que as ferramentas contratadas oferecem?</label><div class="radio-group mt-2"><label><input type="radio" name="full_resource_usage" value="sim"> Sim</label><label><input type="radio" name="full_resource_usage" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Utiliza alguma ferramenta de gestao de processos BPM integrada ao ERP?</label><div class="radio-group mt-2"><label><input type="radio" name="use_bpm_erp" value="sim"> Sim</label><label><input type="radio" name="use_bpm_erp" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Possui Portal WEB para apresentação de informações de RH para os colaboradores?</label><div class="radio-group mt-2"><label><input type="radio" name="has_hr_portal" value="sim"> Sim</label><label><input type="radio" name="has_hr_portal" value="nao"> Não</label></div></div><div class="form-group mb-4"><label>Aplica ciência dos dados para otimizar processos?</label><div class="radio-group mt-2"><label><input type="radio" name="apply_data_science" value="sim"> Sim</label><label><input type="radio" name="apply_data_science" value="nao"> Não</label></div></div>'); },

    showResult: function () {
        var that = this;
        this.isNavigating = true;
        
        $("#landing-quiz").hide();
        $("#landing-result").show();

        var scores = {
            'Recrutamento': this.calcPillar(['process_formal', 'use_ats', 'dedicated_team']),
            'Admissão': this.calcPillar(['has_digital_admission', 'use_admission_portal', 'has_electronic_signature', 'has_integration_program', 'is_admission_secure']),
            'DP': this.calcPillar(['dp_automated', 'esocial_compliant', 'defined_dp_workflows']),
            'T&D': this.calcPillar(['td_strategy_clear', 'td_aligned_goals', 'td_annual_planning', 'td_management_participation', 'td_gap_indicators', 'td_leaders_contribution', 'td_impact_indicators', 'td_results_correlation']),
            'Cultura': this.calcPillar(['culture_alignment', 'expression_freedom', 'people_valuation', 'defined_hierarchy', 'climate_survey']),
            'Analytics': this.calcPillar(['has_rh_indicators', 'use_dashboards', 'cost_per_employee', 'indicators_integration', 'structured_performance_eval', 'productivity_tracking', 'benefits_cost_comparison', 'turnover_cost_analysis']),
            'Tecnologia': this.calcPillar(['use_ai_rh', 'integrated_data', 'payroll_cloud', 'use_hr_consultancy', 'full_resource_usage', 'use_bpm_erp', 'has_hr_portal', 'apply_data_science'])
        };

        var totalScore = 0;
        var scoreCount = 0;
        for (var key in scores) {
            if (scores.hasOwnProperty(key)) {
                totalScore += scores[key];
                scoreCount++;
            }
        }
        var avg = scoreCount > 0 ? (totalScore / scoreCount) : 0;
        
        // Limita o score máximo a 80% para nunca atingir Estratégico
        if (avg > 80) {
            avg = 80;
        }

        var roundedAvg = Math.round(avg);
        this.finalScoreGlobal = roundedAvg;

        var title = "";
        var currentStateDescription = "";
        var visionToStrategic = "Para alcançar o patamar de <strong>RH Estratégico</strong>, o setor deve atuar como parceiro direto do negócio. Isso exige o uso de <em>People Analytics</em> preditivo para antecipar cenários, alinhamento total das metas de pessoas com os objetivos financeiros da empresa e uma cultura contínua de inovação.";

        if (roundedAvg <= 20) {
            title = "Tradicional";
            currentStateDescription = "Foco em processos operacionais e burocráticos. Há um grande potencial para iniciar a automação e ganhar agilidade.";
        } else if (roundedAvg <= 40) {
            title = "Ágil";
            currentStateDescription = "Busca por eficiência e rapidez, iniciando a transição para processos mais dinâmicos e menos engessados.";
        } else if (roundedAvg <= 60) {
            title = "Digital";
            currentStateDescription = "Uso de tecnologia e automação consolidados. O próximo passo é equilibrar as ferramentas com a valorização da experiência humana.";
        } else if (roundedAvg <= 80) {
            title = "Humanizado";
            currentStateDescription = "Une tecnologia avançada e foco genuíno nas pessoas, promovendo uma excelente experiência para o colaborador.";
        } else {
            title = "Estratégico";
            currentStateDescription = "O setor atua como parceiro de negócios, focando em análise de dados, métricas e retenção profunda de talentos.";
        }
        
        this.finalClassification = title;

        $("#final-score-pct").text(roundedAvg + "%");
        $("#result-title").text(title);
        $("#result-description").html("<span style='font-size:14px;'>Sua operação foi classificada como <strong>" + title + "</strong>.</span><br><span style='font-size:12px; color:#666; margin-top:5px; display:block;'>" + currentStateDescription + "</span>");
        $("#vision-text").html(visionToStrategic);

        this.generateMaturityLevels(title); 
        this.generateRecommendations();
        
        var myLoading = FLUIGC.loading(window, { textMessage: 'Avaliando dados e gerando relatório do seu RH...', title: 'Aguarde' });
        myLoading.show();

        this.renderRadarChart(scores, false);
        
        setTimeout(function() {
            var element = document.getElementById('landing-result');
            var nomeEmpresa = (that.userAnswers['company_name'] || 'RH').replace(/\s+/g, '_');
            
            var opt = {
                margin:       10,
                filename:     'Diagnostico_' + nomeEmpresa + '.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).outputPdf('datauristring').then(function(pdfBase64) {
                var rawBase64 = pdfBase64.split(',')[1];
                
                that.uploadPdfToECM(rawBase64, nomeEmpresa, function(documentId, linkPublico) {
                    that.saveLeadToFluig(roundedAvg, title, scores, documentId, linkPublico, rawBase64, myLoading);
                });

            })["catch"](function(err) {
                console.error("Erro ao gerar PDF:", err);
                that.saveLeadToFluig(roundedAvg, title, scores, null, "", "", myLoading);
            });
            
        }, 1000); 

    },

    uploadPdfToECM: function(base64Content, nomeEmpresa, callback) {
        var that = this;
        var pastaDestinoECM = 214; 
        var baseUrl = this.authConfig.url || WCMAPI.getServerURL();
        
        var nomeSanitizado = nomeEmpresa.replace(/[^a-zA-Z0-9]/g, "_");
        var fileName = 'Diagnostico_' + nomeSanitizado + '.pdf';

        var byteCharacters = atob(base64Content);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        var blob = new Blob([byteArray], {type: 'application/pdf'});

        var endpointUpload = baseUrl + "/api/public/2.0/contentfiles/upload/?fileName=" + encodeURIComponent(fileName);
        var authHeaderUpload = that.getOAuthData(endpointUpload, 'POST');

        $.ajax({
            url: endpointUpload,
            type: 'POST',
            data: blob,
            processData: false,
            contentType: 'application/octet-stream',
            headers: authHeaderUpload,
            crossDomain: true,
            success: function (resUpload) {
                
                var payload = {
                    "description": fileName,
                    "parentId": pastaDestinoECM,
                    "downloadEnabled": true,    
                    "internalVisualizer": true, 
                    "isPrivate": false, 
                    "publicDocument": true,     
                    "attachments": [{
                        "fileName": fileName,
                        "principal": true
                    }]
                };

                var endpointCreate = baseUrl + "/api/public/ecm/document/createDocument";
                var authHeaderCreate = that.getOAuthData(endpointCreate, 'POST');

                $.ajax({
                    url: endpointCreate,
                    type: 'POST',
                    data: JSON.stringify(payload),
                    contentType: 'application/json',
                    headers: authHeaderCreate,
                    crossDomain: true,
                    success: function (response) {
                        var docId = null;
                        if (response && response.content && response.content.id) {
                            docId = response.content.id;
                        } else if (response && response.content && response.content.documentId) {
                            docId = response.content.documentId;
                        }

                        if (docId) {
                            var endpointDownloadUrl = baseUrl + "/api/public/2.0/documents/getDownloadURL/" + docId;
                            var authHeaderDownload = that.getOAuthData(endpointDownloadUrl, 'GET');

                            $.ajax({
                                url: endpointDownloadUrl,
                                type: 'GET',
                                headers: authHeaderDownload,
                                crossDomain: true,
                                success: function (resUrl) {
                                    var linkPublico = "";
                                    if (resUrl && resUrl.content) {
                                        linkPublico = resUrl.content; 
                                    } else {
                                        linkPublico = baseUrl + "/portal/p/1/documentdownload?documentId=" + docId + "&version=1000";
                                    }
                                    console.log("LINK PUBLICO GERADO PARA O EMAIL: ", linkPublico);
                                    callback(docId, linkPublico);
                                },
                                error: function (xhr) {
                                    console.error("Erro ao buscar URL publica, caindo para fallback:", xhr.responseText);
                                    var linkDireto = baseUrl + "/portal/p/1/documentdownload?documentId=" + docId + "&version=1000";
                                    callback(docId, linkDireto);
                                }
                            });

                        } else {
                            callback(null, "");
                        }
                    },
                    error: function (xhr) {
                        console.error("Erro na Publicação do Documento GED:", xhr.responseText);
                        callback(null, "");
                    }
                });
                
            },
            error: function (xhr) {
                console.error("Erro no Upload Físico OAuth:", xhr.responseText);
                callback(null, ""); 
            }
        });
    },

    generateMaturityLevels: function (currentLevel) {
        var levels = [
            { titulo: "Tradicional", requisitos: ["Foco em Tarefas Administrativas e Burocráticas", "Recrutamento e Seleção Operacionais", "Gestão Reativa de Pessoas", "Estrutura Hierárquica e Verticalizada"] },
            { titulo: "Ágil", requisitos: ["Ciclos Curtos e Entregas Iterativas", "Adaptabilidade em vez de Prescrição", "Transparência e Comunicação Eficaz", "Redes Colaborativas sobre Hierarquias Rígidas"] },
            { titulo: "Digital", requisitos: ["Automação de Processos Operacionais", "Gestão Baseada em Dados (People Analytics)", "Foco na Experiência do Colaborador (Employee Experience)", "Armazenamento em Nuvem e Segurança (LGPD)"] },
            { titulo: "Humanizado", requisitos: ["Escuta Ativa com Feedback Digital Contínuo", "Tecnologia como Meio, não como Fim", "Personalização da Experiência (Hiper-personalização)", "Cultura de Segurança Psicológica e Ética de Dados"] },
            { titulo: "Estratégico", requisitos: ["Alinhamento com os Objetivos do Negócio", "Visão de Longo Prazo e Planejamento Sucessório", "Cultura de Indicadores e Resultados (KPIs)", "Gestão da Mudança e Transformação Organizacional"] }
        ];

        var levelNames = ["Tradicional", "Ágil", "Digital", "Humanizado", "Estratégico"];
        var currentIndex = levelNames.indexOf(currentLevel);

        var baseScore = currentIndex * 20;
        var progressInLevel = this.finalScoreGlobal - baseScore;
        var reqsCumpridosNesteNivel = Math.ceil(progressInLevel / 5);
        
        if (reqsCumpridosNesteNivel < 0) reqsCumpridosNesteNivel = 0;
        if (reqsCumpridosNesteNivel > 4) reqsCumpridosNesteNivel = 4;

        var html = "";
        for (var i = 0; i < levels.length; i++) {
            var lvl = levels[i];
            
            var isCurrent = (lvl.titulo === currentLevel);
            var extraClass = isCurrent ? ' current-level-card' : '';
            var badgeHtml = isCurrent ? '<span class="badge-popular" style="background:#ffffff; color:#d68910;">Você está aqui</span>' : '';

            var reqHtml = '<ul class="level-checklist">';
            for(var j=0; j<lvl.requisitos.length; j++) {
                var status = 'missing'; 
                
                if (i < currentIndex) {
                    status = 'achieved'; 
                } else if (i === currentIndex && j < reqsCumpridosNesteNivel) {
                    status = 'achieved'; 
                }

                var iconClass = status === 'achieved' ? 'flaticon-check-circle' : 'flaticon-cancel';
                reqHtml += '<li class="' + status + '"><i class="flaticon ' + iconClass + '"></i><span>' + lvl.requisitos[j] + '</span></li>';
            }
            reqHtml += '</ul>';

            html += 
                '<div class="level-card' + extraClass + '">' +
                    badgeHtml +
                    '<h6>' + lvl.titulo + '</h6>' +
                    reqHtml +
                '</div>';
        }

        $("#maturity-levels-list").html(html);
    },

    animateScoreCounter: function (targetScore, durationMs) {
        var $el = $("#final-score-pct");
        var start = 0;
        var end = targetScore;
        if (end === 0) {
            $el.text("0%");
            return;
        }
        var range = end - start;
        var current = start;
        var increment = end > start ? 1 : -1;
        var stepTime = Math.abs(Math.floor(durationMs / range));
        
        var timer = setInterval(function() {
            current += increment;
            $el.text(current + "%");
            if (current == end) {
                clearInterval(timer);
                $el.addClass('score-pop');
                setTimeout(function() {
                    $el.removeClass('score-pop');
                    $el.css({ color: '#1eaad9' });
                }, 400);
            }
        }, stepTime);
    },

    calcPillar: function (keys) {
        var count = 0, that = this;
        keys.forEach(function (k) { if (that.userAnswers[k] === 'sim') count++; });
        // Regra de negócio: Score máximo travado em 80% para não atingir o nível Estratégico
        return (count / keys.length) * 80;
    },

    renderRadarChart: function (scores, animate) {
        var canvas = document.getElementById('maturityChart');
        var ctx = canvas.getContext('2d');

        if (this.myChart) this.myChart.destroy();

        var gradientFill = ctx.createLinearGradient(0, 0, 0, 400);
        gradientFill.addColorStop(0, 'rgba(30, 170, 217, 0.5)');
        gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0.05)');

        var chartLabels = [];
        var chartData = [];
        for (var key in scores) {
            if (scores.hasOwnProperty(key)) {
                chartLabels.push(key);
                chartData.push(scores[key]);
            }
        }
        
        var durationMs = animate === false ? 0 : 2200; 

        this.myChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Maturidade (%)',
                    data: chartData,
                    backgroundColor: gradientFill,
                    borderColor: '#1eaad9',
                    borderWidth: 3,
                    pointBackgroundColor: '#2b2b2b',
                    pointBorderColor: '#f39c12',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#f39c12',
                    pointHoverBorderColor: '#ffffff',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                animation: { duration: durationMs, easing: 'easeOutExpo' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(10, 20, 30, 0.95)',
                        titleFont: { size: 14, family: "'Poppins', sans-serif" },
                        bodyFont: { size: 14, weight: 'normal', family: "'Poppins', sans-serif" },
                        padding: 14,
                        cornerRadius: 4,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                var val = context.raw;
                                var lbl = '';
                                if (val <= 20) lbl = 'Tradicional';
                                else if (val <= 40) lbl = 'Ágil';
                                else if (val <= 60) lbl = 'Digital';
                                else if (val <= 80) lbl = 'Humanizado';
                                else lbl = 'Estratégico';
                                return ' SCORE: ' + val.toFixed(0) + '% - Nível: ' + lbl; 
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: { display: true, color: 'rgba(30, 170, 217, 0.2)', lineWidth: 1 },
                        grid: { circular: false, color: 'rgba(30, 170, 217, 0.15)', lineWidth: 1.5 },
                        pointLabels: {
                            font: { size: 12, family: "'Poppins', sans-serif", weight: '700' },
                            color: '#333'
                        },
                        ticks: { beginAtZero: true, max: 100, stepSize: 20, display: false }
                    }
                }
            }
        });
    },

    generateRecommendations: function () {
        var listaInsights = [
            { titulo: "Desenvolvimento de carreira", descricao: "Oferecer oportunidade de desenvolvimento de carreira e promoções com base no desempenho." },
            { titulo: "Remuneração variável", descricao: "Implementar programas de remuneração variável para incentivar o desempenho e reter talentos." },
            { titulo: "Benefícios flexíveis", descricao: "Oferecer benefícios flexíveis para promover um equilíbrio saudável entre trabalho e vida pessoal." },
            { titulo: "Benefícios e Salários", descricao: "Oferecer salários competitivos e benefícios atraentes, como planos de saúde e aposentadoria." },
            { titulo: "Feedback regular", descricao: "Fornecer feedback regular sobre o desempenho para promover a transparência." },
            { titulo: "Pesquisas salariais", descricao: "Realizar pesquisas salariais regulares para garantir o alinhamento com o mercado." },
            { titulo: "Treinamentos", descricao: "Fornecer treinamentos em habilidades necessárias para o desenvolvimento das pessoas." },
            { titulo: "Benefícios não financeiros", descricao: "Oferecer benefícios não financeiros para promover a saúde e o bem-estar dos funcionários." },
            { titulo: "Transparência", descricao: "Fornecer transparência na remuneração, incluindo a divulgação de critérios de promoção." },
            { titulo: "Bem-estar financeiro", descricao: "Implementar programas de bem-estar financeiro para ajudar os funcionários a planejar o futuro." },
            { titulo: "Saúde mental e bem-estar", descricao: "A decisão de expandir benefícios focados em saúde mental indica maior conscientização." },
            { titulo: "Modelo híbrido", descricao: "O trabalho híbrido consolida-se como preferido (53%), flexibilidade é essencial." },
            { titulo: "Retenção e cultura", descricao: "75% das empresas apontam a retenção de talentos como um dos maiores desafios." },
            { titulo: "Adesão a Bônus", descricao: "A concessão de bônus pode ser essencial para reter talentos em cenários econômicos difíceis." },
            { titulo: "Automação da folha", descricao: "82% das empresas usam software para folha de pagamento; a tecnologia é pilar." },
            { titulo: "Jornada digital", descricao: "Apenas 21% já estão avançadas. O foco deve ser investimento aliado à cultura." },
            { titulo: "RH digitalizado", descricao: "Aumentar investimentos em automação de tarefas e busca por dados (People Analytics)." },
            { titulo: "Aplicações da IA no RH", descricao: "O principal uso da IA é em recrutamento, automatizando tarefas operacionais." },
            { titulo: "Boas-vindas personalizadas", descricao: "Receba o colaborador de forma pessoal para criar um vínculo forte desde o primeiro dia." },
            { titulo: "Expectativas e responsabilidades", descricao: "Informações claras ajudam a deixar o novo colaborador preparado para o trabalho." },
            { titulo: "Reconhecimento e recompensas", descricao: "Reconhecer o esforço gera senso de valor e motivação contínua." },
            { titulo: "Oportunidades de crescimento", descricao: "Todo profissional se sente estimulado quando percebe que pode crescer na empresa." },
            { titulo: "Positividade", descricao: "Criar um ambiente saudável, colaborativo e inclusivo é importante para a experiência." },
            { titulo: "Equilíbrio", descricao: "Flexibilidade de horários e políticas contribuem para a satisfação de todos." }
        ];

        var listaOportunidades = [
            { titulo: "Desempenho e Crescimento", descricao: "Empresas com planos claros de ascensão tendem a ter maior engajamento. Um framework sólido é diferencial." },
            { titulo: "Treinamento e desenvolvimento", descricao: "Expandir a visão: iniciativas como mentoria e job rotation equilibram a qualificação." },
            { titulo: "Novos formatos de benefícios", descricao: "Modelos híbridos de remuneração e personalização aumentam o engajamento sem elevating custos." },
            { titulo: "Personalização dos benefícios", descricao: "Permite que os colaboradores escolham pacotes que atendam melhor às suas necessidades individuais." },
            { titulo: "Estratégia de cultura organizacional", descricao: "Empresas que equilibram inovação e pertencimento tendem a ter melhores resultados." },
            { titulo: "Política de bônus", descricao: "A retenção de talentos estratégicos em níveis técnicos especializados pode gerar vantagens." },
            { titulo: "Métricas de longo prazo", descricao: "Para que o bônus cumpra seu papel, é essencial vinculá-lo a resultados sustentáveis." },
            { titulo: "Uso estratégico da tecnologia", descricao: "A automação na folha é um ponto de partida para expandir a digitalização analítica." },
            { titulo: "Cultura digital e inovação", descricao: "O investimento em tecnologia precisa incentivar um mindset digital em toda a empresa." },
            { titulo: "Transformação digital", descricao: "O RH pode atuar como um facilitador da mudança, liderando iniciativas de reskilling." },
            { titulo: "Cultura de reconhecimento", descricao: "Criar modelos diversificados pode fortalecer a motivação indo além de metas financeiras." },
            { titulo: "Engajamento e retenção", descricao: "Traduzir informações sobre o clima em ações efetivas, como trilhas personalizadas." },
            { titulo: "Agenda ESG no RH", descricao: "Empresas que integram ESG de forma estratégica ganham vantagem competitiva na atração." },
            { titulo: "Capacitação em análise de dados", descricao: "Treinamentos em estatística e dados aceleram a adoção do People Analytics." },
            { titulo: "Integração de dados", descricao: "Investir em soluções que consolidem dados de diferentes fontes e garantam a governança." },
            { titulo: "Modelos preditivos", descricao: "Prever riscos de turnover e embasar estratégias são diferenciais do mercado atual." },
            { titulo: "Estratégia para IA no RH", descricao: "Definir um plano estratégico maximiza o impacto, indo além de simples automação." },
            { titulo: "Mudança cultural e IA", descricao: "A resistência à IA pode ser reduzida com projeções práticas de como a tecnologia complementa o trabalho." }
        ];

        function shuffleArray(array) {
            for (var i = array.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
            return array;
        }

        var randomInsights = shuffleArray(listaInsights).slice(0, 4);
        this.chosenInsights = randomInsights; 
        
        var htmlInsights = "";
        for (var idx1 = 0; idx1 < randomInsights.length; idx1++) {
            var r1 = randomInsights[idx1];
            
            htmlInsights += 
                '<div class="rec-item">' +
                    '<h6>' + r1.titulo + '</h6>' +
                    '<p>' + r1.descricao + '</p>' +
                '</div>';
        }
        $("#recommendations-list").html(htmlInsights);

        var randomOportunidades = shuffleArray(listaOportunidades).slice(0, 3);
        this.chosenOpportunities = randomOportunidades; 
        
        var htmlOportunidades = "";
        for (var idx2 = 0; idx2 < randomOportunidades.length; idx2++) {
            var r2 = randomOportunidades[idx2];
            
            var isHighlighted = (idx2 === 1); 
            var extraClass = isHighlighted ? ' highlight-card' : '';
            var badgeHtml = isHighlighted ? '<span class="badge-popular">Prioridade</span>' : '';

            htmlOportunidades += 
                '<div class="rec-item' + extraClass + '">' +
                    badgeHtml +
                    '<h6>' + r2.titulo + '</h6>' +
                    '<p>' + r2.descricao + '</p>' +
                '</div>';
        }
        $("#opportunities-list").html(htmlOportunidades);
    },

    sendToWhatsApp: function() {
        var whatsappNumber = "5531998377928"; 
        var company = this.userAnswers['company_name'] || "Empresa Não Informada";
        var user = this.userAnswers['user_name'] || "Usuário";
        var challenge = $("#strategic_challenge").val() || "Não preenchido.";

        var message = "Olá, finalizei o *Diagnóstico InteRHativa*!\n\n";
        message += "*Nome:* " + user + "\n";
        message += "*Empresa:* " + company + "\n";
        message += "*Score Final:* " + this.finalScoreGlobal + "% (" + this.finalClassification + ")\n\n";
        message += "*Meu principal desafio estratégico hoje é:*\n" + challenge + "\n\n";
        message += "Gostaria de falar com um especialista para iniciar a transformação do meu RH.";

        var encodedMessage = encodeURIComponent(message);
        window.open("https://wa.me/" + whatsappNumber + "?text=" + encodedMessage, "_blank");
    },

    getOAuthData: function (url, method) {
        var oauth = OAuth({
            consumer: { key: this.authConfig.consumerKey, secret: this.authConfig.consumerSecret },
            signature_method: 'HMAC-SHA1',
            hash_function: function (base_string, key) { return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64); },
            nonce_length: 6
        });
        return oauth.toHeader(oauth.authorize({ url: url, method: method, data: {} }, { key: this.authConfig.token, secret: this.authConfig.tokenSecret }));
    },

    // FUNÇÃO DE SAVE COM O CHUNKING DO BASE64
    saveLeadToFluig: function (finalScore, classification, pillarScores, documentId, linkPublico, rawBase64, myLoading) {
        var that = this;
        var phoneVal = this.userAnswers['telefone'] || "";
        var email = this.userAnswers['user_email'] || "anonimo@teste.com";
        var processId = "PROCESSO_RH_DIAGNOSTICO";
        var baseUrl = this.authConfig.url || WCMAPI.getServerURL();
        var endpoint = baseUrl + "/process-management/api/v2/processes/" + processId + "/start";

        var apiPayload = {
            "targetState": 5,
            "targetAssignee": "guilherme-af",
            "comment": "Diagnóstico Detalhado - Score: " + finalScore + "%",
            "formFields": {
                "empresa": this.userAnswers['company_name'] || "",
                "segmento": this.userAnswers['company_segment'] || "",
                "tamanho": this.userAnswers['company_size'] || "",
                "company_site": this.userAnswers['company_site'] || "",
                "rh_team_size": this.userAnswers['rh_team_size'] || "",
                "nome_contato": this.userAnswers['user_name'] || "",
                "email_contato": email,
                "telefone": phoneVal,
                "user_role": this.userAnswers['user_role'] || "",
                "score_final": finalScore.toString(),
                "nivel_maturidade": classification,
                "json_respostas": JSON.stringify(this.userAnswers),
                
                "json_insights": JSON.stringify(this.chosenInsights || []),
                "json_oportunidades": JSON.stringify(this.chosenOpportunities || []),

                "process_formal": this.userAnswers['process_formal'] || "Não informado",
                "use_ats": this.userAnswers['use_ats'] || "Não informado",
                "ats_name": this.userAnswers['ats_name'] || "",
                "job_channels": this.userAnswers['job_channels'] || "",
                "dedicated_team": this.userAnswers['dedicated_team'] || "Não informado",
                "hiring_volume": this.userAnswers['hiring_volume'] || "",
                "has_digital_admission": this.userAnswers['has_digital_admission'] || "Não informado",
                "use_admission_portal": this.userAnswers['use_admission_portal'] || "Não informado",
                "has_electronic_signature": this.userAnswers['has_electronic_signature'] || "Não informado",
                "has_integration_program": this.userAnswers['has_integration_program'] || "Não informado",
                "is_admission_secure": this.userAnswers['is_admission_secure'] || "Não informado",
                "dp_system": this.userAnswers['dp_system'] || "",
                "payroll_responsible": this.userAnswers['payroll_responsible'] || "",
                "dp_automated": this.userAnswers['dp_automated'] || "Não informado",
                "esocial_compliant": this.userAnswers['esocial_compliant'] || "Não informado",
                "use_sheets_payroll": this.userAnswers['use_sheets_payroll'] || "Não informado",
                "defined_dp_workflows": this.userAnswers['defined_dp_workflows'] || "Não informado",
                "td_strategy_clear": this.userAnswers['td_strategy_clear'] || "Não informado",
                "td_aligned_goals": this.userAnswers['td_aligned_goals'] || "Não informado",
                "td_annual_planning": this.userAnswers['td_annual_planning'] || "Não informado",
                "td_management_participation": this.userAnswers['td_management_participation'] || "Não informado",
                "td_gap_indicators": this.userAnswers['td_gap_indicators'] || "Não informado",
                "td_leaders_contribution": this.userAnswers['td_leaders_contribution'] || "Não informado",
                "td_impact_indicators": this.userAnswers['td_impact_indicators'] || "Não informado",
                "td_results_correlation": this.userAnswers['td_results_correlation'] || "Não informado",
                "culture_alignment": this.userAnswers['culture_alignment'] || "Não informado",
                "expression_freedom": this.userAnswers['expression_freedom'] || "Não informado",
                "people_valuation": this.userAnswers['people_valuation'] || "Não informado",
                "defined_hierarchy": this.userAnswers['defined_hierarchy'] || "Não informado",
                "culture_intro": this.userAnswers['culture_intro'] || "",
                "climate_survey": this.userAnswers['climate_survey'] || "Não informado",
                "has_rh_indicators": this.userAnswers['has_rh_indicators'] || "Não informado",
                "use_dashboards": this.userAnswers['use_dashboards'] || "Não informado",
                "cost_per_employee": this.userAnswers['cost_per_employee'] || "Não informado",
                "indicators_integration": this.userAnswers['indicators_integration'] || "Não informado",
                "structured_performance_eval": this.userAnswers['structured_performance_eval'] || "Não informado",
                "productivity_tracking": this.userAnswers['productivity_tracking'] || "Não informado",
                "benefits_cost_comparison": this.userAnswers['benefits_cost_comparison'] || "Não informado",
                "turnover_cost_analysis": this.userAnswers['turnover_cost_analysis'] || "Não informado",
                "indicator_tools": this.userAnswers['indicator_tools'] || "",
                "use_ai_rh": this.userAnswers['use_ai_rh'] || "Não informado",
                "integrated_data": this.userAnswers['integrated_data'] || "Não informado",
                "payroll_cloud": this.userAnswers['payroll_cloud'] || "Não informado",
                "use_hr_consultancy": this.userAnswers['use_hr_consultancy'] || "Não informado",
                "full_resource_usage": this.userAnswers['full_resource_usage'] || "Não informado",
                "use_bpm_erp": this.userAnswers['use_bpm_erp'] || "Não informado",
                "has_hr_portal": this.userAnswers['has_hr_portal'] || "Não informado",
                "apply_data_science": this.userAnswers['apply_data_science'] || "Não informado",
                
                "id_pdf_diagnostico": documentId ? documentId.toString() : "",
                "link_pdf_publico": linkPublico ? linkPublico : ""
            }
        };

        // FRAGMENTAÇÃO DO BASE64: Evita o erro 'Texto do campo muito extenso' no banco de dados do Fluig
        var chunkBase64 = rawBase64 || "";
        var chunkSize = 50000;

        for (var i = 0; i < 20; i++) {
            var chunk = "";
            if (chunkBase64 && chunkBase64.length > i * chunkSize) {
                chunk = chunkBase64.substring(i * chunkSize, (i + 1) * chunkSize);
            }
            apiPayload.formFields["pdf_base64_" + (i + 1)] = chunk;
        }

        var authHeader = this.getOAuthData(endpoint, 'POST');

        $.ajax({
            url: endpoint,
            type: 'POST',
            data: JSON.stringify(apiPayload),
            contentType: 'application/json',
            headers: authHeader,
            crossDomain: true,
            success: function (response) {
                if(myLoading) myLoading.hide();
                console.log('Sucesso! Diagnóstico enviado (ID ' + response.processInstanceId + ').');

                $("#landing-result").addClass("vibrant-tech-entrance");
                
                if (window.innerWidth <= 768) {
                    $('html, body').animate({ scrollTop: $(".content-box").offset().top - 80 }, 300);
                }

                that.renderRadarChart(pillarScores, true);
                $("#final-score-pct").text("0%");
                that.animateScoreCounter(finalScore, 1500);

            },
            error: function (xhr, status, error) {
                if(myLoading) myLoading.hide();
                console.error("Erro API BPM:", xhr.responseText);
                
                $("#landing-result").addClass("vibrant-tech-entrance");
                that.renderRadarChart(pillarScores, true);
                $("#final-score-pct").text("0%");
                that.animateScoreCounter(finalScore, 1500);
            }
        });
    }
});