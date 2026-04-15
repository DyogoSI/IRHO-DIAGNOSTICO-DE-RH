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
                        <p class="main-subtitle">Sua operação de RH está preparada para a transformação digital?<br>Responda às questões e receba uma análise imediata.</p>
                        
                        <div class="alert alert-info text-left mb-4" role="alert">
                            Com o diagnóstico será possivel detectar pontos criticos e de melhorias tecnologicas que poderão ser aplicadas nos processos operacionais de RH.
                        </div>

                        <div class="terms-container mb-4 text-left">
                            <div class="checkbox">
                                <label>
                                    <input type="checkbox" id="consent_privacy_${instanceId}" data-privacy-check> 
                                    <span class="terms-text">
                                        Estou ciente de que os dados coletados serão utilizados para <strong>finalidade de diagnóstico e pesquisas de mercado</strong>.<br>A Interhativa garante que as informações <strong>não serão compartilhadas com terceiros</strong>.
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
                                        <p id="result-description" class="text-muted small mt-2"></p>
                                    </div>
                                    
                                    <div class="mt-4">
                                        <canvas id="maturityChart"></canvas>
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    
                                    <h4 class="section-subtitle mt-0">Jornada de Evolução:</h4>
                                    <div id="maturity-levels-list"></div>

                                    <h4 class="section-subtitle mt-4">Sugestões de Melhoria com Insights:</h4>
                                    <div id="recommendations-list"></div>

                                    <h4 class="section-subtitle mt-4">Oportunidades:</h4>
                                    <div id="opportunities-list"></div>
                                    
                                    <div class="cta-box mt-4">
                                        <h5 class="text-center">Pronto para transformar o seu RH?</h5>
                                        <p class="text-center">Transforme este diagnostico em uma vantagem competitiva para a sua organização.</p>
                                        
                                        <div class="form-group mt-4 text-left" style="width: 100%;">
                                            <label style="font-weight: 600; color: #ffffff;">Descreva o desafio estratégico que a sua empresa enfrenta hoje e que você considera como prioridade para a transformação do seu RH?</label>
                                            <textarea id="strategic_challenge" class="form-control" rows="3" placeholder="Digite aqui o seu principal desafio..."></textarea>
                                        </div>

                                        <div class="text-center mt-4" style="width: 100%;">
                                            <button id="btn-whatsapp" class="btn btn-success btn-lg" style="width: 100%; white-space: normal;">
                                                <i class="flaticon flaticon-whatsapp icon-sm"></i> QUERO INICIAR A TRANSFORMAÇÃO DO MEU RH
                                            </button>
                                            <br><br>
                                            <button class="btn btn-restart" onclick="window.location.reload()">
                                                <i class="flaticon flaticon-refresh icon-sm"></i> Refazer Diagnóstico
                                            </button>
                                        </div>

                                        <div class="social-share mt-5" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; width: 100%; text-align: center;">
                                            <p style="font-size: 13px; color: #e3eef7; margin-bottom: 15px;">Fale com a gente ou acompanhe nossas redes:</p>
                                            <div style="display: flex; justify-content: center; gap: 20px;">
                                                
                                                <a href="https://www.linkedin.com/company/interhativa/" target="_blank" style="color: #fff; background: rgba(255,255,255,0.1); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%; text-decoration: none; transition: all 0.3s ease;" onmouseover="this.style.background='#0077b5'; this.style.transform='translateY(-3px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'" title="LinkedIn">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                                    </svg>
                                                </a>
                                                
                                                <a href="mailto:contato@interhativa.com.br" style="color: #fff; background: rgba(255,255,255,0.1); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%; text-decoration: none; transition: all 0.3s ease;" onmouseover="this.style.background='#ea4335'; this.style.transform='translateY(-3px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'" title="E-mail">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                                        <path d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"/>
                                                    </svg>
                                                </a>
                                                
                                                <a href="https://wa.me/5531998377928" target="_blank" style="color: #fff; background: rgba(255,255,255,0.1); width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; border-radius: 50%; text-decoration: none; transition: all 0.3s ease;" onmouseover="this.style.background='#25D366'; this.style.transform='translateY(-3px)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'" title="WhatsApp">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.347-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                                                    </svg>
                                                </a>
                                                
                                            </div>
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