<div id="RHDiagnostico_${instanceId}" class="wcm-widget-class super-widget fluig-style-guide" data-params="RHDiagnostico.instance()">
    
    <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js"></script>
    
    <script type="text/javascript" src="/page_rh_diagnostico/resources/js/oauth-1.0a.js"></script>
    <script type="text/javascript" src="/page_rh_diagnostico/resources/js/form_validation.js"></script>
    <script type="text/javascript" src="/page_rh_diagnostico/resources/js/test_helper.js"></script>

    <div class="landing-wrapper">
        <header class="landing-header">
            <div class="container">
                <div class="header-content">
                    <div class="brand">
                        <img src="/page_rh_diagnostico/resources/images/IRHO-BRANCO-LARANJA.png" alt="InteRHativa Logo" class="brand-logo">
                    </div>
                </div>
            </div>
        </header>

        <main class="landing-main">
            <div class="container">
                <div class="content-box">
                     
                    <div id="landing-intro" class="section-step active text-center">
                        <div class="intro-icon mb-4">
                            <i class="flaticon flaticon-assignment icon-xl text-primary"></i>
                        </div>
                        <h1 class="main-title">Diagnóstico InteRHativa</h1>
                        <p class="main-subtitle">Sua operação de RH está preparada para a transformação digital? Responda às questões e receba uma análise imediata.</p>
                        
                        <div class="alert alert-info text-left mb-4" role="alert">
                            Com o diagnóstico será possivel detectar pontos criticos e de melhorias tecnologicas que poderão ser aplicadas nos processos operacionais de RH.
                        </div>

                        <div class="terms-container mb-4 text-left">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" id="consent_privacy_${instanceId}" data-privacy-check> 
                                    <span class="terms-text">
                                        Estou ciente de que os dados coletados serão utilizados para <strong>finalidade de diagnóstico e pesquisas de mercado</strong>. A Interhativa garante que as informações <strong>não serão compartilhadas com terceiros</strong>.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <button class="btn btn-primary btn-lg btn-start" data-start-quiz disabled>
                            <span>Iniciar Diagnóstico</span> <i class="flaticon flaticon-chevron-right icon-sm"></i>
                        </button>
                    </div>

                    <div id="landing-quiz" class="section-step" style="display:none;">
                        <div class="wizard-stepper mb-5">
                            <div class="step-item active" data-step="1"><div class="step-circle">1</div><span class="step-label">Empresa</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="2"><div class="step-circle">2</div><span class="step-label">Recrutamento</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="3"><div class="step-circle">3</div><span class="step-label">Admissão</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="4"><div class="step-circle">4</div><span class="step-label">DP</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="5"><div class="step-circle">5</div><span class="step-label">T&D</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="6"><div class="step-circle">6</div><span class="step-label">Cultura</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="7"><div class="step-circle">7</div><span class="step-label">Analytics</span></div>
                            <div class="step-line"></div>
                            <div class="step-item" data-step="8"><div class="step-circle">8</div><span class="step-label">Tecnologia</span></div>
                        </div>

                        <div id="step-content-container"></div>

                        <div class="footer-actions mt-5" id="quiz-navigation" style="display: flex; justify-content: space-between; align-items: center;">
                             <button class="btn btn-default btn-lg" data-prev-step id="btn-prev-step">
                                <i class="flaticon flaticon-chevron-left icon-sm"></i> Voltar
                             </button>
                             <button class="btn btn-primary btn-lg" data-next-step id="btn-next-step">
                                Próximo Passo <i class="flaticon flaticon-chevron-right icon-sm"></i>
                             </button>
                        </div>
                    </div>

                    <div id="landing-result" class="section-step" style="display:none;">
                        
                        <div class="text-center mb-5">
                            <h2 style="color: #1eaad9; font-weight: 700;">Diagnóstico de maturidade do RH</h2>
                        </div>

                        <div class="dashboard-container">
                            <div class="row">
                                <div class="col-md-5 text-center">
                                    <div class="score-card">
                                        <div class="score-radial"><span id="final-score-pct">0%</span></div>
                                        <h3 id="result-title" class="mt-3">Aguarde...</h3>
                                        <p id="result-description" class="text-muted small"></p>
                                    </div>
                                    
                                    <div id="strategic-vision" class="alert alert-warning text-left mt-3" style="font-size: 13px;">
                                        <strong>Próximo Nível: RH Estratégico</strong><br>
                                        <span id="vision-text">Para alcançar o patamar de RH Estratégico, o foco deve ser alinhar a gestão de pessoas aos objetivos de negócios, atuando como parceiro ativo nas decisões da diretoria, com uso intensivo de dados preditivos.</span>
                                    </div>

                                    <div class="mt-4">
                                        <canvas id="maturityChart"></canvas>
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <h4 class="section-subtitle">Sugestões de Melhoria com Insights:</h4>
                                    <div id="recommendations-list"></div>

                                    <h4 class="section-subtitle mt-4">Oportunidades:</h4>
                                    <div id="opportunities-list"></div>
                                    
                                    <div class="cta-box mt-4">
                                        <h5 class="text-center">Pronto para transformar o seu RH?</h5>
                                        <p class="text-center">Transforme este diagnostico em uma vantagem competitiva para a sua organização.</p>
                                        
                                        <div class="form-group mt-4 text-left">
                                            <label style="font-weight: 600; color: #333;">Descreva o desafio estratégico que a sua empresa enfrenta hoje e que você considera como prioridade para a transformação do seu RH?</label>
                                            <textarea id="strategic_challenge" class="form-control" rows="3" placeholder="Digite aqui o seu principal desafio..."></textarea>
                                        </div>

                                        <div class="text-center mt-4">
                                            <button id="btn-whatsapp" class="btn btn-success btn-lg" style="width: 100%; white-space: normal;">
                                                <i class="flaticon flaticon-whatsapp icon-sm"></i> QUERO INICIAR A TRANSFORMAÇÃO DO MEU RH
                                            </button>
                                            <br><br>
                                            <button class="btn btn-restart" onclick="window.location.reload()">
                                                <i class="flaticon flaticon-refresh icon-sm"></i> Refazer Diagnóstico
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>

        <footer class="landing-footer text-center">
            <p>&copy; 2025 Interhativa. Inteligência em Gestão de Pessoas.</p>
        </footer>
    </div>
</div>