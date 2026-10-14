(function() {
var module = angular.module("tec.gerador", [ "tec.common", "tec.common-ui" ]);

/* os itens da árvore precisam de altura fixa para poder fazer os cálculos de virtualização */
var TEC_ARVORE_GERADOR_ITEM_HEIGHT_PX = 23;

/**
 * opções:
 *   exibirMensagemInformativa: boolean
 *   exibirUniverso: boolean
 *   exibirFormato: boolean
 *   permitirGerar: boolean
 *   opcoesDesbloqueada: boolean
 *   configurarCadernoDesbloqueada: boolean
 *   logado: boolean
 *   universoSelecionado: Objeto no formato: {id: "", nome: "" }, usando qualquer opcao existente em UniversoEstudoEnum
 *   	exemplo Concurso - {id: "CONCURSOS", nome: "Concursos" }
 *   			OAB - {id: "OAB", nome: "OAB" }
 *   contexto: variavel ${ctx}. É obrigatorio quando for passado valor de 'permitirGerar = false';
 *   caderno: long. Id do caderno que será editado
 *   
 */

module.directive("tecGerador", function(tec) {
	return tec.defaultDirective({
		scope: {
			opcoes: "=",
			callbackAlterarFiltros: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador">
				<div class="gerador-mensagem-informativa" ng-if="vm.opcoes.exibirMensagemInformativa">
					<div class="gerador-caixa-mensagem-informativa-conteudo">Veja aqui na prática como é fácil personalizar seus estudos e focar exatamente no que você precisa</div>
				</div>

				<div ng-hide="vm.opcoes.mostrarSoGerarCaderno">
					<tec-gerador-menu-formato-questoes
							filtros="vm.filtros"
							formato="vm.formato"
							opcoes="vm.opcoes"
							on-alteracao="vm.alterarFormato(formato)"
							configurar-caderno="vm.configurarCaderno"
							bloquear-discursivas="vm.bloquearDiscursivas"
							bloquear-ineditas="vm.bloquearIneditas"
							exibir-botao-esconder-filtros="vm.opcoes.exibirBotaoEsconderFiltros"
							callback-esconder-filtros="vm.opcoes.callbackEsconderFiltros"
							logado="vm.opcoes.logado && vm.opcoes.logado == true"

							on-alterar-universo="vm.alterarUniverso(universo)"
							universo-selecionado="vm.opcoes.universoSelecionado"
							total-cadernos="vm.totalCadernos"
							mostrar-filtros="vm.mostrarFiltros"	>
					</tec-gerador-menu-formato-questoes>

					<tec-gerador-conteudo
							universo="vm.universo"
							formato="vm.formato"
							opcoes="vm.opcoes"
							filtros="vm.filtros"
							on-alteracao-numero-questoes-encontradas="vm.alterarNumeroQuestoesEncontradas(numeroQuestoesEncontradas)"
							configurar-caderno="vm.configurarCaderno"
							ng-if="vm.universo && vm.formato"
							esconder-borda-inferior="vm.configurarCaderno"
							logado="vm.opcoes.logado && vm.opcoes.logado == true"
							gerar-em-serie="vm.gerarEmSerie"
							cadernos-gerados="vm.cadernosGerados"
							forcar-ativar-filtros="vm.opcoes.forcarAtivarFiltros"
							filtros-forcados="vm.opcoes.filtrosForcados"
							nao-exibir-configurar-caderno="vm.opcoes.naoExibirConfigurarCaderno"
							on-exibir-configurar-caderno="vm.opcoes.onExibirConfigurarCaderno"
							callback-alterar-filtros=vm.callbackAlterarFiltros
							mostrar-filtros=vm.mostrarFiltros>
					</tec-gerador-conteudo>

					<tec-gerador-configurar
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							configurar-caderno="vm.configurarCaderno"
							configurar-caderno-desbloqueada="vm.opcoes.configurarCadernoDesbloqueada"
							ng-if="vm.configurarCaderno && vm.universo && vm.formato"
							materias="vm.materias"
							lista-assuntos="vm.listaAssuntos"
							matriz-assuntos="vm.matrizAssuntos"
							numero-questoes-encontradas="vm.numeroQuestoesEncontradas"
							total-questoes-selecionadas="vm.totalQuestoesConfiguradas"
							gerar-em-serie="vm.gerarEmSerie"
							cadernos-gerados="vm.cadernosGerados"
							arvore-assuntos="vm.arvoreAssuntos"
							on-exibir-configurar-caderno="vm.opcoes.onExibirConfigurarCaderno"
							atualizar-configuracoes="vm.atualizarConfiguracoes"
							forma-escolher-questoes="vm.formaEscolherQuestoes">
					</tec-gerador-configurar>
				</div>

				<tec-gerador-caderno
						universo="vm.universo"
						formato="vm.formato"
						opcoes="vm.opcoes"
						filtros="vm.filtros"
						numero-questoes-encontradas="vm.numeroQuestoesEncontradas"
						ng-if="vm.universo && vm.formato && vm.opcoes.permitirGerar"
						materias="vm.materias"
						matriz-assuntos="vm.matrizAssuntos"
						lista-assuntos="vm.listaAssuntos"
						assuntos="vm.assuntos"
						total-questoes-selecionadas="vm.totalQuestoesConfiguradas"
						configurar-caderno="vm.configurarCaderno"
						gerar-em-serie="vm.gerarEmSerie"
						cadernos-gerados="vm.cadernosGerados"
						arvore-assuntos="vm.arvoreAssuntos"
						caderno = "vm.opcoes.caderno"
						atualizar-configuracoes = "vm.atualizarConfiguracoes"
						forma-escolher-questoes="vm.formaEscolherQuestoes">
				</tec-gerador-caderno>
				
				<tec-gerador-caderno-deslogado 
					ng-if="!vm.opcoes.permitirGerar && !vm.opcoes.naoExibirGerarCaderno"
					contexto="vm.opcoes.contexto"
					>
				</tec-gerador-caderno>
			</div>
		**/}),
		controller: function() {
			var vm = this;
			vm.filtros = {};
			vm.formato = null;
			vm.alterarUniverso = alterarUniverso;
			vm.alterarFormato = alterarFormato;
			vm.alterarNumeroQuestoesEncontradas = alterarNumeroQuestoesEncontradas;
			vm.atualizarConfiguracoes = false;
			vm.materias = [];
			vm.configurarCaderno = (typeof vm.opcoes.universoSelecionado != 'undefined' && vm.opcoes.universoSelecionado.id == 'PASTAS');
			vm.mostrarFiltros = (typeof vm.opcoes.universoSelecionado == 'undefined' || vm.opcoes.universoSelecionado.id != 'PASTAS');
			vm.totalQuestoesConfiguradas = null;
			vm.bloquearDiscursivas = false;
			vm.gerarEmSerie = false;
			vm.cadernosGerados = 0;
			vm.listaAssuntos = [];
			vm.matrizAssuntos = [];
			vm.arvoreAssuntos = {};
			vm.formaEscolherQuestoes = "ALEATORIA";
			vm.totalCadernos = null;

			ativar();

			function ativar() {
				var formaEscolha = localStorage.getItem("tec.formaEscolherQuestoes" + "["+userId+"]");
				vm.totalCadernos = (typeof jsonTotalCadernosSelecionados != 'undefined') ? jsonTotalCadernosSelecionados : null;

				if (formaEscolha && (formaEscolha.toUpperCase() === 'ALEATORIA' || formaEscolha.toUpperCase() === 'RECENTES')) {
					vm.formaEscolherQuestoes = formaEscolha;
				}
			}
			
			function alterarUniverso(universo) {
				vm.universo = universo;
				vm.materias = [];
				vm.listaAssuntos = [];
				if (vm.universo.id == 'CFC') {
					vm.bloquearDiscursivas = true;
				} else {
					vm.bloquearDiscursivas = false;
				}
				vm.bloquearIneditasPara = ['OAB','CFC','VESTIBULAR'];
				vm.bloquearIneditas = vm.bloquearIneditasPara.indexOf(vm.universo.id) >= 0;
			}
			
			function alterarFormato(formato) {
				vm.formato = formato;
				vm.materias = [];
				vm.listaAssuntos = [];
				if (formato.id != 'OBJETIVA_INEDITAS' && vm.filtros && vm.filtros.FILTRO_QUESTAO && vm.filtros.FILTRO_QUESTAO.SOMENTE_ADAPTADAS_INEDITAS) {
					//remover filtro oculto de ineditas.
					delete vm.filtros.FILTRO_QUESTAO.SOMENTE_ADAPTADAS_INEDITAS;
				}
			}
			
			function alterarNumeroQuestoesEncontradas(numeroQuestoesEncontradas) {
				if(vm.callbackAlterarFiltros) {
					vm.callbackAlterarFiltros({"filtros": vm.filtros, "formato": vm.formato, "universo": vm.universo, "numeroQuestoesEncontradas": numeroQuestoesEncontradas});
				}
				vm.numeroQuestoesEncontradas = numeroQuestoesEncontradas;
				vm.atualizarConfiguracoes = true;
			}
		}
	});
});

module.directive("tecGeradorMenuUniversos", function(tec, tecDadosGerador) {
	return tec.defaultDirective({
		scope: {
			filtros: "=",
			opcoes: "=",
			onAlteracao: "&",
			universoSelecionado: "=",
			desativado: "=",
			totalCadernos: "=",
			exibirBotaoEsconderFiltros: "=",
			callbackEsconderFiltros: "=",
			mostrarFiltros: "="

		},
		template: tec.multiline(function() {/**
			<div>
				<div class="gerador-menu-universos-pasta" ng-if="vm.universoSelecionado.id == 'PASTAS'" style="{{ vm.desativado == true ? 'pointer-events: none' : 'pointer-events: auto' }}">
					<div class="gerador-menu-universos-grid">
						<span class="gerador-menu-universos-label">
							<span class="gerador-label">
								Universo<span class="hidden-xs hidden-sm"> de estudo</span>
							</span>
						</span>
						<span class="gerador-menu-universos-corpo">
							<div class="menu-alternador">
								<ul ng-class="{ 'hidden-xs': vm.configUseSelectForMobile }" class="hidden-xs">
									<li class="menu-alternador-opcao ng-binding ativa" ng-class="{ ativa: vm.ativa}" title="Pasta">
										{{vm.totalCadernos}} caderno{{vm.totalCadernos > 1 ? 's' : ''}} selecionado{{vm.totalCadernos > 1 ? 's' : ''}}
									</li>
								</ul>
							</div>
							<span class="gerador-botao-esconder" ng-if="vm.exibirBotaoEsconderFiltros">
								<button class="btn btn-tec" type="button" tabindex="1" ng-click="vm.mostrarFiltrosPastas()">
									<span class="label-esconder-filtros">Filtros</span>
									<span id="" class="glyphicon glyphicon-triangle-top ng-scope" title="" ng-show="vm.mostrarFiltros"></span>
									<span id="" class="glyphicon glyphicon-triangle-bottom ng-scope" title="" ng-show="!vm.mostrarFiltros"></span>
								</button>
							</span>
						</span>
					</div>
				</div>
				<div class="gerador-menu-universos" ng-if="vm.universoSelecionado.id != 'PASTAS'" style="{{ vm.desativado == true ? 'pointer-events: none' : 'pointer-events: auto' }}">
					<div class="gerador-menu-universos-grid">
						<span class="gerador-menu-universos-label">
							<span class="gerador-label">
								Universo
							</span>
						</span>
						<span class="gerador-menu-universos-corpo">
							<div class="menu-alternador">
								<div>
									<select id="menu-alternador" class="form-control"
											ng-model="vm.universoAtivo"
											ng-options="universo as universo.nome disable when universo.bloqueada for universo in vm.universosSelecionaveis track by universo.id"
											ng-change="vm.alterarUniversoAtivo(opcao)">
									</select>
								</div>
							</div>
						</span>
					</div>
				</div>
			</div>
		**/}),
		controller: function($scope, tec) {
			var vm = this;
			vm.alterarUniversoAtivo = alterarUniversoAtivo;
			vm.mostrarFiltrosPastas = mostrarFiltrosPastas;
			vm.universosSelecionaveis = [];

			ativar();
			
			function ativar() {
				tecDadosGerador.buscarUniversos()
				.then(function(universos) {
					vm.universos = universos;
					
					var universoGlobal = { id: "", nome: "Global" };
					vm.universos.splice(0, 0, universoGlobal);

					vm.universosSelecionaveis = vm.universos.filter(function(obj) {
                        return obj.id !== 'PASTAS';
                    });
					
					//carregar filtro do caderno base
					var classificacao = (typeof jsonClassificacao != 'undefined') ? jsonClassificacao : null;
					if (classificacao && classificacao.universoEstudo) {
						angular.forEach(vm.universos, function(universo) {
							if (universo.id == classificacao.universoEstudo) {
								alterarUniversoAtivoInterno(universo)
							}
						});
					} else {
						alterarUniversoAtivoInterno(universoGlobal);
					}
					
				})
				.then(function() {
					if (vm.universoSelecionado) {
						alterarUniversoAtivoInterno(vm.universoSelecionado);
					}
				});
			}
			
			function alterarUniversoAtivo() {
				var opcao = vm.universoAtivo;

				if (Object.keys(vm.filtros).length) {
					tec.confirm("Você irá perder os filtros selecionados. Deseja continuar?", "Alterar universo de estudo", function(confirmou) {
						if (confirmou) {
							alterarUniversoAtivoInterno(opcao);
							$scope.$apply();
						}
					});
				} else {
					alterarUniversoAtivoInterno(opcao);
				}
			}

			function alterarUniversoAtivoInterno(opcao) {
				vm.universoAtivo = opcao;
				vm.onAlteracao({ universo: opcao });
			}

			function mostrarFiltrosPastas() {
				vm.mostrarFiltros = !vm.mostrarFiltros;
				$(".gerador-conteudo").toggle();
			}
		}
	});
});

module.directive("tecGeradorMenuFormatoQuestoes", function(tec, tecDadosGerador) {
	return tec.defaultDirective({
		scope: {
			filtros: "=",
			opcoes: "=",
			formato: "=",
			onAlteracao: "&",
			configurarCaderno: "=",
			bloquearDiscursivas: "=",
			bloquearIneditas: "=",
			exibirBotaoEsconderFiltros: "=",
			callbackEsconderFiltros: "=",
			logado: "=",

			onAlterarUniverso: "&",
			universoSelecionado: "=",
			totalCadernos: "=",
			mostrarFiltros: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<div class="gerador-menu-universos-pasta" ng-if="vm.universoSelecionado.id == 'PASTAS'">
					<div class="gerador-menu-universos-grid">
						<span class="gerador-menu-universos-label">
							<span class="gerador-label">
								Universo<span class="hidden-xs hidden-sm"> de estudo</span>
							</span>
						</span>
						<span class="gerador-menu-universos-corpo">
							<div class="menu-alternador">
								<ul ng-class="{ 'hidden-xs': vm.configUseSelectForMobile }" class="hidden-xs">
									<li class="menu-alternador-opcao ng-binding ativa" ng-class="{ ativa: vm.ativa}" title="Pasta">
										{{vm.totalCadernos}} caderno{{vm.totalCadernos > 1 ? 's' : ''}} selecionado{{vm.totalCadernos > 1 ? 's' : ''}}
									</li>
								</ul>
							</div>
							<span class="gerador-botao-esconder" ng-if="vm.exibirBotaoEsconderFiltros">
								<button class="btn btn-tec" type="button" tabindex="1" ng-click="vm.mostrarFiltrosPastas()">
									<span id="" class="glyphicon glyphicon-triangle-top ng-scope" title="" ng-show="vm.mostrarFiltros"></span>
									<span id="" class="glyphicon glyphicon-triangle-bottom ng-scope" title="" ng-show="!vm.mostrarFiltros"></span>
									<span class="label-esconder-filtros link-limpo">{{vm.mostrarFiltros ? 'Recolher' : 'Expandir'}}</span>
								</button>
							</span>
						</span>
					</div>
				</div>

				<div class="gerador-menu-universo-formato-mobile" ng-if="vm.universoSelecionado.id != 'PASTAS' && vm.opcoes.exibirFormato">
					<tec-menu-alternador
						lista-opcoes="vm.formatosQuestoes"
						opcao-ativa="vm.formato"
						config-radio-buttons="true"
						config-use-select-for-mobile="true"
						on-alteracao="vm.alterarFormatoQuestaoAtivo(opcao)">
					</tec-menu-alternador>
				</div>

				<div class="gerador-menu-universo-formato" ng-if="vm.universoSelecionado.id != 'PASTAS'" ng-show="vm.opcoes.exibirFormato || vm.opcoes.exibirUniverso">
					<div class="gerador-menu-universo-formato-opcoes">
						<div class="gerador-menu-universo-formato-opcoes-label hidden-xs hidden-sm hidden-md">
							<span class="gerador-label">Filtrar Questões</span>
						</div>

						<div class="gerador-menu-opcao-universos" ng-show="vm.opcoes.exibirUniverso">
							<div class="gerador-menu-opcao-universos-label">
								<span class="gerador-label">Universo</span>
							</div>
							<div class="gerador-menu-opcao-universos-corpo">
								<div class="menu-alternador">
									<div>
										<select id="menu-alternador" class="form-control" ng-disabled="vm.opcoes.caderno !== undefined"
											ng-model="vm.universoAtivo"
											ng-options="universo as universo.nome disable when universo.bloqueada for universo in vm.universosSelecionaveis track by universo.id"
											ng-change="vm.alterarUniversoAtivo(opcao)">
										</select>
									</div>
								</div>
							</div>
						</div>

						<div class="gerador-menu-opcao-formato" ng-show="vm.opcoes.exibirFormato != false">
							<div class="gerador-menu-opcao-formato-corpo">
								<tec-menu-alternador
										lista-opcoes="vm.formatosQuestoes"
										opcao-ativa="vm.formato"
										config-radio-buttons="true"
										config-use-select-for-mobile="true"
										on-alteracao="vm.alterarFormatoQuestaoAtivo(opcao)">
								</tec-menu-alternador>
							</div>
                        </div>
					</div>

					<div class="gerador-botao-esconder" ng-if="vm.exibirBotaoEsconderFiltros">
						<button class="btn btn-tec" type="button" tabindex="1" ng-click="vm.callbackEsconderFiltros()">
							<span id="" class="glyphicon glyphicon-triangle-top  ng-scope" title=""></span>
							<span class="label-esconder-filtros link-limpo">Recolher</span>
						</button>
					</div>
				</div>
			</div>
		**/}),
		controller: function($scope, tec, tecDadosGeradorFiltros) {
			var vm = this;
			vm.alterarFormatoQuestaoAtivo = alterarFormatoQuestaoAtivo;

			vm.alterarUniversoAtivo = alterarUniversoAtivo;
			vm.mostrarFiltrosPastas = mostrarFiltrosPastas;
			vm.universosSelecionaveis = [];

			ativar();
			
			function ativar() {
				buscarUniversos();

				tecDadosGerador.buscarFormatosQuestao()
				.then(function(formatos) {
					vm.formatosQuestoes = formatos;

					if (typeof geradorRemoverDiscursiva !== 'undefined' && geradorRemoverDiscursiva) {
						removerFormatoDiscursiva()
					}
					if (!vm.logado) {
						tratarNaoLogado()
					}

					//carregar formatoQuestao do caderno base
					vm.cadernoBase = (typeof jsonClassificacao != 'undefined') ? jsonClassificacao : null;
					if (vm.cadernoBase) {
						angular.forEach(vm.formatosQuestoes, function(formato) {
							if (formato.id == vm.cadernoBase.formatoQuestoes) {
								alterarFormatoQuestaoAtivoInterno(formato)
							}
						});
					} else if (typeof jsonFormato != 'undefined' && jsonFormato != null && jsonFormato.trim().length > 0) {
						angular.forEach(vm.formatosQuestoes, function(formato) {
							if (formato.id == jsonFormato) {
								alterarFormatoQuestaoAtivoInterno(formato)
							}
						});
					} else {
						alterarFormatoQuestaoAtivoInterno(formatos[0]);
					}
				})
				.then(function() {
					$scope.$watch("vm.bloquearDiscursivas", function() {
						checarBloqueioDiscursiva()
					});
				})
				.then(function() {
					$scope.$watch("vm.bloquearIneditas", function() {
						checarBloqueioIneditas()
					});
				})
			}

			function buscarUniversos() {
				tecDadosGerador.buscarUniversos()
					.then(function(universos) {
						vm.universos = universos;

						var universoGlobal = { id: "", nome: "Global" };
						vm.universos.splice(0, 0, universoGlobal);

						vm.universosSelecionaveis = vm.universos.filter(function(obj) {
							return obj.id !== 'PASTAS';
						});

						//carregar filtro do caderno base
						var classificacao = (typeof jsonClassificacao != 'undefined') ? jsonClassificacao : null;
						if (classificacao && classificacao.universoEstudo) {
							angular.forEach(vm.universos, function(universo) {
								if (universo.id == classificacao.universoEstudo) {
									alterarUniversoAtivoInterno(universo)
								}
							});
						} else {
							alterarUniversoAtivoInterno(universoGlobal);
						}
					})
					.then(function() {
						if (vm.universoSelecionado) {
							alterarUniversoAtivoInterno(vm.universoSelecionado);
						}
					});
			}

			function alterarUniversoAtivo() {
				var opcao = vm.universoAtivo;

				if (Object.keys(vm.filtros).length) {
					tec.confirm("Você irá perder os filtros selecionados. Deseja continuar?", "Alterar universo de estudo", function(confirmou) {
						if (confirmou) {
							alterarUniversoAtivoInterno(opcao);
							$scope.$apply();
						}
					});
				} else {
					alterarUniversoAtivoInterno(opcao);
				}
			}

			function alterarUniversoAtivoInterno(opcao) {
				vm.universoAtivo = opcao;
				vm.onAlterarUniverso({ universo: opcao });
			}

			function mostrarFiltrosPastas() {
				vm.mostrarFiltros = !vm.mostrarFiltros;
				$(".gerador-conteudo").toggle();
			}
			
			function checarBloqueioDiscursiva() {
				angular.forEach(vm.formatosQuestoes, function(formato) {
					if (formato.id == 'DISCURSIVA') {
						formato.bloqueada = vm.bloquearDiscursivas;
						if (formato.bloqueada) {
							alterarFormatoQuestaoAtivoInterno(vm.formatosQuestoes[0])
						}
					}
				});
			}

			function checarBloqueioIneditas() {
				angular.forEach(vm.formatosQuestoes, function(formato) {
					if (formato.id == 'OBJETIVA_INEDITAS') {
						formato.bloqueada = vm.bloquearIneditas;
						if (formato.bloqueada) {
							alterarFormatoQuestaoAtivoInterno(vm.formatosQuestoes[0])
						}
					}
				});
			}

			function removerFormatoDiscursiva() {
				var index = -1;
				for (var i = 0; i < vm.formatosQuestoes.length; i++){
					if (vm.formatosQuestoes[i].id == 'DISCURSIVA') {
						index = i;
						break;
					}
				}

				if (index >= 0) {
					vm.formatosQuestoes.splice(index, 1);
				}
			}

			function tratarNaoLogado() {
				var index = -1;
				for (var i = 0; i < vm.formatosQuestoes.length; i++){
					if (vm.formatosQuestoes[i].id == 'OBJETIVA_INEDITAS') {
						index = i;
					}
					if (vm.formatosQuestoes[i].id == 'OBJETIVA') {
						vm.formatosQuestoes[i].nome = 'Objetivas'
					}
				}

				if (index >= 0) {
					vm.formatosQuestoes.splice(index, 1);
				}
			}

			function alterarFormatoQuestaoAtivo(opcao) {
				if (opcao && vm.formato.id == opcao.id){
					return;
				}
				var somenteFiltrosVisiveis = tecDadosGeradorFiltros.somenteFiltrosVisiveis(vm.filtros);
				if (Object.keys(somenteFiltrosVisiveis).length) {
					tec.confirm("Você irá perder os filtros selecionados. Deseja continuar?", "Alterar conteúdo", function(confirmou) {
						if (confirmou) {
							vm.filtros = {}
							vm.configurarCaderno = false;
							alterarFormatoQuestaoAtivoInterno(opcao);
							$scope.$apply();
						}
					});
				} else {
					alterarFormatoQuestaoAtivoInterno(opcao);
				}
			}

			function alterarFormatoQuestaoAtivoInterno(opcao) {
				if (opcao) {
					vm.onAlteracao({ formato: opcao });
					addFiltroSomenteAdaptasIneditasSeNecessario(opcao);
				}
			}

			function addFiltroSomenteAdaptasIneditasSeNecessario(formato){
				if(angular.equals(vm.filtros.FILTRO_QUESTAO, {})) {
					vm.filtros = {};
				}
				vm.possuiFiltroSomenteAdaptasIneditas = (vm.filtros && vm.filtros.FILTRO_QUESTAO && vm.filtros.FILTRO_QUESTAO.SOMENTE_ADAPTADAS_INEDITAS) ? true : false;
				if (formato && formato.id == "OBJETIVA_INEDITAS" && !vm.possuiFiltroSomenteAdaptasIneditas) {
					vm.filtros = tecDadosGeradorFiltros.copiarFiltros(vm.filtros);
					tecDadosGeradorFiltros.getFiltroAdaptadasIneditas()
						.then(function(filtro){
							tecDadosGeradorFiltros.adicionarFiltro(vm.filtros, filtro, true);
							$scope.$apply();
						})
				}
			}
		}
	});
});

module.directive("tecGeradorConteudo", function(tec, tecDadosGerador) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			opcoes: "=",
			filtros: "=",
			onAlteracaoNumeroQuestoesEncontradas: "&",
			configurarCaderno: "=",
			esconderBordaInferior: "=",
			logado: "=",
			gerarEmSerie: "=",
			cadernosGerados: "=",
			forcarAtivarFiltros: "=",
			filtrosForcados: "=",
			naoExibirConfigurarCaderno: "=",
			onExibirConfigurarCaderno: "=",
			mostrarFiltros: "="

		},
		template: tec.multiline(function() {/**
			<div class="gerador-conteudo" ng-class="{'sem-borda-inferior': vm.esconderBordaInferior, 'esconder': !vm.mostrarFiltros }">
				<div class="gerador-conteudo-grid">
					<div class="gerador-conteudo-filtros">
						<tec-menu-alternador
								lista-opcoes="vm.gruposFiltro"
								opcao-ativa="vm.grupoFiltroAtivo"
								config-use-select-for-mobile="true"
								on-alteracao="vm.alterarGrupoFiltroAtivo(opcao)">
						</tec-menu-alternador>
					</div>

					<div class="gerador-conteudo-filtros-mobile">
						<div>
							<span class="sombra-esquerda"></span>
							<ul>
								<li class="trigger-sombra-esquerda" data-sombra="sombra-esquerda" aria-hidden="true"></li>
								<li role="button" class="grupo-filtro" ng-repeat="opcao in vm.gruposFiltro | filter: { id: '!PASTAS'}" ng-click="vm.alterarGrupoFiltroAtivo(opcao)"
									ng-class="{ativo: vm.grupoFiltroAtivo.id == opcao.id, bloqueado: opcao.bloqueada, 'filtros-usado': vm.quantidadePorTipo[opcao.id] > 0}" title="{{opcao.nome}}">
									<span class="filtro-usado" ng-if="vm.quantidadePorTipo[opcao.id] > 0"></span>
									<span class="nome-filtro">{{opcao.nome}}</span>
									<span class="quantidade-selecionado" ng-if="vm.quantidadePorTipo[opcao.id] > 0">{{vm.quantidadePorTipo[opcao.id]}}</span>
								</li>
								<li class="trigger-sombra-direita" data-sombra="sombra-direita" aria-hidden="true"></li>
							</ul>
							<span class="sombra-direita"></span>
						</div>
					</div>

					<tec-gerador-conteudo-canvas
							opcoes="vm.opcoes"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							grupo-filtro="vm.grupoFiltroAtivo"
							on-alteracao-numero-questoes-encontradas="vm.alterarNumeroQuestoesEncontradas(numeroQuestoesEncontradas)"
							on-grupo-filtro-ativo-invalido="vm.alterarGrupoFiltroAtivo(vm.gruposFiltro[0]);"
							ng-if="vm.grupoFiltroAtivo"
							configurar-caderno="vm.configurarCaderno"
							logado="vm.logado"
							gerar-em-serie="vm.gerarEmSerie"
							cadernos-gerados="vm.cadernosGerados"
							forcar-ativar-filtros="vm.forcarAtivarFiltros"
							filtros-forcados="vm.filtrosForcados"
							nao-exibir-configurar-caderno="vm.naoExibirConfigurarCaderno"
							on-exibir-configurar-caderno="vm.onExibirConfigurarCaderno"
							configurar-caderno-desbloqueada="vm.opcoes.configurarCadernoDesbloqueada">
					</tec-gerador-conteudo-canvas>
				</div>
			</div>
		**/}),
		controller: function($scope, tecDadosGeradorFiltros) {
			var vm = this;
			vm.alterarGrupoFiltroAtivo = alterarGrupoFiltroAtivo;
			vm.alterarNumeroQuestoesEncontradas = alterarNumeroQuestoesEncontradas;

			vm.quantidadePorTipo = {};

			ativar();

			function ativar() {
				$scope.$watch("vm.universo", function(universo) {
					if (universo) {
						tecDadosGerador.buscarGruposFiltro(universo)
						.then(function(gruposFiltro) {
							vm.filtros = tecDadosGeradorFiltros.limparFiltros(vm.filtros); 
							vm.gruposFiltro = gruposFiltro;
							alterarGrupoFiltroAtivo(gruposFiltro[0]);
						});
					}
				});
				var observer = new IntersectionObserver(function(entries) {
						angular.forEach(entries, function(e) {
							$("." + e.target.dataset["sombra"])[0].classList.toggle("mostrar-sombra", e.intersectionRatio < 1);
						});
					},
					{ root: $(".gerador-conteudo-filtros-mobile ul")[0], rootMargin: "0px 10px", threshold: [1] }
				);

				observer.observe($(".trigger-sombra-esquerda")[0]);
				observer.observe($(".trigger-sombra-direita")[0]);
			}
			
			function alterarGrupoFiltroAtivo(opcao) {
				if (!opcao) {
					vm.alterarGrupoFiltroAtivo(vm.gruposFiltro[0]);
				} else {
					vm.grupoFiltroAtivo = opcao;
				}
			}
			
			function alterarNumeroQuestoesEncontradas(numeroQuestoesEncontradas) {
				vm.onAlteracaoNumeroQuestoesEncontradas({ numeroQuestoesEncontradas: numeroQuestoesEncontradas });
				if (vm.logado) {
					//bloquear caso não haja filtro ou caso o filtro selecionado seja somente_adaptadas_ineditas pois esse filtro fica oculto
					var bloquearAbaQuestoes = vm.opcoes.opcoesDesbloqueada != true && ( Object.keys(vm.filtros).length == 0 || (Object.keys(vm.filtros).length == 1 && vm.filtros.FILTRO_QUESTAO && vm.filtros.FILTRO_QUESTAO.SOMENTE_ADAPTADAS_INEDITAS));
					vm.gruposFiltro[vm.gruposFiltro.length - 1].bloqueada = bloquearAbaQuestoes;
				}

				atualizarContagem();
			}

			function atualizarContagem() {
				angular.forEach(vm.gruposFiltro, function(grupo) {
					vm.quantidadePorTipo[grupo.id] = 0;
				});

				angular.forEach(Object.keys(vm.filtros), function(tipoFiltro) {
					var quantidade = Object.keys(vm.filtros[tipoFiltro]).length;
					var grupo = null;

					switch (tipoFiltro) {
						case "MATERIA":
						case "ASSUNTO":
						case "SEM_CLASSIFICACAO_ASSUNTO":
							grupo = "MATERIAS_ASSUNTOS";
							break;
						case "BANCA":
							grupo = "BANCAS";
							break;
						case "ORGAO":
						case "CARGO":
						case "AREA_CARGO":
						case "ESPECIALIDADE":
							grupo = "ORGAOS_CARGOS";
							break;
						case "ANO":
							grupo = "ANOS";
							break;
						case "AREA_CONCURSO":
							grupo = "AREAS";
							break;
						case "ESCOLARIDADE":
							grupo = "ESCOLARIDADES";
							break;
						case "PROFISSAO":
							grupo = "PROFISSOES";
							break;
						case "ESFERA":
						case "ESTADO_ENUM":
						case "CIDADE":
							grupo = "ESFERAS";
							break;
						case "PASTA_FAVORITAS":
							grupo = "FAVORITAS";
							break;
						case "ENUNCIADO":
							grupo = "ENUNCIADOS";
							break;
						case "FILTRO_QUESTAO":
							grupo = "QUESTOES";
							if (vm.filtros.FILTRO_QUESTAO.SOMENTE_ADAPTADAS_INEDITAS) {
								quantidade -= 1;
							}
							break;
					}

					if (grupo != null && vm.quantidadePorTipo[grupo] != null) {
						vm.quantidadePorTipo[grupo] = vm.quantidadePorTipo[grupo] + quantidade;
					}
				});
			}
		}
	});
});

module.directive("tecGeradorConteudoCanvas", function(tec, tecDadosGeradorFiltros, $timeout, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			opcoes: "=",
			universo: "=",
			formato: "=",
			grupoFiltro: "=",
			filtros: "=",
			onAlteracaoNumeroQuestoesEncontradas: "&",
			onGrupoFiltroAtivoInvalido: "&",
			configurarCaderno: "=",
			logado: "=",
			gerarEmSerie: "=",
			cadernosGerados: "=",
			forcarAtivarFiltros: "=",
			filtrosForcados: "=",
			naoExibirConfigurarCaderno: "=",
			onExibirConfigurarCaderno: "=",
			configurarCadernoDesbloqueada: "=",
		},
		template: tec.multiline(function() {/**
		<div>
			<div class="gerador-conteudo-canvas gerador-box ng-class:{'resize': vm.resizeBuscador }" >
				<div class="gerador-conteudo-canvas-grid">
					<tec-gerador-buscador-materias
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'MATERIAS_ASSUNTOS' }"
							ng-show="vm.grupoFiltro.id == 'MATERIAS_ASSUNTOS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							universo="vm.universo"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							resize-buscador="vm.resizeBuscador" >
					</tec-gerador-buscador-materias>
					
					<tec-gerador-buscador-bancas
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'BANCAS' }"
							ng-show="vm.grupoFiltro.id == 'BANCAS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							universo="vm.universo"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							resize-buscador="vm.resizeBuscador" >
					</tec-gerador-buscador-bancas>
					
					<tec-gerador-buscador-orgaos
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'ORGAOS_CARGOS' }"
							ng-show="vm.grupoFiltro.id == 'ORGAOS_CARGOS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							universo="vm.universo"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-orgaos>
					
					<tec-gerador-buscador-anos
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'ANOS' }"
							ng-show="vm.grupoFiltro.id == 'ANOS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-anos>
					
					<tec-gerador-buscador-areas
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'AREAS' }"
							ng-show="vm.grupoFiltro.id == 'AREAS'"
							render="vm.grupoFiltro.id == 'AREAS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-areas>
					
					<tec-gerador-buscador-escolaridades
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'ESCOLARIDADES' }"
							ng-show="vm.grupoFiltro.id == 'ESCOLARIDADES'"
							render="vm.grupoFiltro.id == 'ESCOLARIDADES'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							resize-buscador="vm.resizeBuscador" >
					</tec-gerador-buscador-escolaridades>
					
					<tec-gerador-buscador-profissoes
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'PROFISSOES' }"
							ng-show="vm.grupoFiltro.id == 'PROFISSOES'"
							render="vm.grupoFiltro.id == 'PROFISSOES'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-profissoes>
					
					<tec-gerador-buscador-esferas
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'ESFERAS' }"
							ng-show="vm.grupoFiltro.id == 'ESFERAS'"
							render="vm.grupoFiltro.id == 'ESFERAS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-esferas>
					
					<tec-gerador-buscador-favoritas 
							ng-if="vm.logado"
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'FAVORITAS' }"
							ng-show="vm.grupoFiltro.id == 'FAVORITAS'"
							render="vm.grupoFiltro.id == 'FAVORITAS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							resize-buscador="vm.resizeBuscador" >
					</tec-gerador-buscador-favoritas>
					
					<tec-gerador-buscador-enunciados 
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'ENUNCIADOS' }"
							ng-show="vm.grupoFiltro.id == 'ENUNCIADOS'"
							render="vm.grupoFiltro.id == 'ENUNCIADOS'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							resize-buscador="vm.resizeBuscador" >
					</tec-gerador-buscador-enunciados>
					
					<tec-gerador-buscador-questoes
							ng-class="{'caixaBusca': vm.grupoFiltro.id == 'QUESTOES' }"
							ng-show="vm.grupoFiltro.id == 'QUESTOES'"
							render="vm.grupoFiltro.id == 'QUESTOES'"
							universo="vm.universo"
							formato="vm.formato"
							filtros="vm.filtros"
							filtros-atalho="vm.filtrosAtalho"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)" 
							resize-buscador="vm.resizeBuscador">
					</tec-gerador-buscador-questoes>
					
					<tec-gerador-filtrador
							opcoes="vm.opcoes"
							universo="vm.universo"
                            formato="vm.formato"
							filtros="vm.filtros"
							filtros-atalho="vm.filtrosAtalho"
							numero-questoes-encontradas="vm.numeroQuestoesEncontradas"
							gerar-em-serie="vm.gerarEmSerie"
							on-filtro-adicionado="vm.adicionarFiltro(filtro)"
							on-filtro-removido="vm.removerFiltro(filtro)"
							on-limpar-filtros="vm.limparFiltros()"
							configurar-caderno="vm.configurarCaderno" 
							nao-exibir-configurar-caderno="vm.naoExibirConfigurarCaderno"
							on-exibir-configurar-caderno="vm.onExibirConfigurarCaderno"
							mobile="true" >
					</tec-gerador-filtrador>
				</div>
			</div>
			<div class="somente-desktop">
				<div class="gerador-conteudo-canvas filtrador-box ng-class:{'resize': vm.resizeBuscador }" >
					<div class="gerador-conteudo-canvas-grid">
						<tec-gerador-filtrador
								opcoes="vm.opcoes"
								universo="vm.universo"
                                formato="vm.formato"
								filtros="vm.filtros"
								filtros-atalho="vm.filtrosAtalho"
								numero-questoes-encontradas="vm.numeroQuestoesEncontradas"
								gerar-em-serie="vm.gerarEmSerie"
								on-filtro-adicionado="vm.adicionarFiltro(filtro)"
								on-filtro-removido="vm.removerFiltro(filtro)"
								on-limpar-filtros="vm.limparFiltros()"
								mobile="false"
								configurar-caderno="vm.configurarCaderno" 
								resize-buscador="vm.resizeBuscador"
								nao-exibir-configurar-caderno="vm.naoExibirConfigurarCaderno"
								on-exibir-configurar-caderno="vm.onExibirConfigurarCaderno"
								configurar-caderno-desbloqueada="vm.configurarCadernoDesbloqueada">
						</tec-gerador-filtrador>
					</div>
				</div>
			</div>
			
		</div>
		**/}),
		controller: function($scope, $timeout, tecDadosGerador, $q) {
			var vm = this;
			vm.adicionarFiltro = adicionarFiltro;
			vm.removerFiltro = removerFiltro;
			vm.limparFiltros = limparFiltros;
			vm.resizeBuscador = false;
			vm.filtrosAtalho = [];

			// Debounce da contagem: agrupa uma rajada de cliques em filtros numa
			// única consulta ao banco (ex.: adicionar 2020..2025 em sequência).
			var DEBOUNCE_CONTAGEM_MS = 800;
			var timerContagem = null;
			// Cancelador da contagem que ainda estiver em andamento no servidor.
			var cancelarContagemEmVoo = null;

			ativar();
			
			function ativar() {
				$scope.$watchGroup(['vm.filtros', 'vm.gerarEmSerie', 'vm.cadernosGerados', 'vm.formato'], function() {
					atualizarContagemQuestoes();
				});

				// Se a contagem foi barrada por captcha (429), o filtro entra mas o total não é
				// atualizado. Ao resolver o captcha, refaz a contagem para o total ficar coerente.
				document.addEventListener("captchaResolvido", executarContagemQuestoes);
				$scope.$on("$destroy", function() {
					document.removeEventListener("captchaResolvido", executarContagemQuestoes);
				});

				$scope.$watch('vm.filtros', function() {
					angular.forEach(vm.filtrosAtalho, function(atalho) {
						atalho.esconderAtalho = false;

						if (!!vm.filtros['FILTRO_QUESTAO']) {
							atalho.esconderAtalho = !!vm.filtros['FILTRO_QUESTAO'][atalho.id];
						}
					});
				});
				
				var filtrosCadernoBase = (typeof jsonFiltrosGeracao != 'undefined') ? jsonFiltrosGeracao : null;
				if (filtrosCadernoBase) {
					carregarFiltrosDoCadernoBase();
				}
			}
			
			function carregarFiltrosDoCadernoBase() {
				var adaptadasIneditas = false;
				if(vm.forcarAtivarFiltros) {
					tecDadosBuscadores.forcarCarregamentoDeOpcoesNaoListadas(vm.filtrosForcados);
				}
				tecDadosBuscadores.carregamentoCompleto()
					.then(function(){
						var promises = [];
						var filtrosMap = tecDadosBuscadores.carregarFiltrosDoCadernoBase();
						angular.forEach(filtrosMap, function(filtros) {
							angular.forEach(filtros, function(filtro) {
								adaptadasIneditas = (adaptadasIneditas == false && filtro.id == "SOMENTE_ADAPTADAS_INEDITAS") ? true : adaptadasIneditas;
								vm.adicionarFiltro(filtro, true);
							});
						});
						var formato = (vm.formato && vm.formato.id == 'OBJETIVA' && adaptadasIneditas) ? 'OBJETIVA_INEDITAS' : vm.formato.id;
						vm.formato = tecDadosGerador.getFormatoQuestao(formato);

						$scope.$apply();
					})
			}

			function adicionarFiltro(filtro, cadernoBase) {
				var flagCadernoBase = !cadernoBase ? false : cadernoBase;
				vm.filtros = tecDadosGeradorFiltros.copiarFiltros(vm.filtros);
				tecDadosGeradorFiltros.adicionarFiltro(vm.filtros, filtro, flagCadernoBase);
			}

			function removerFiltro(filtro) {
				vm.filtros = tecDadosGeradorFiltros.copiarFiltros(vm.filtros);
				tecDadosGeradorFiltros.removerFiltro(vm.filtros, filtro, vm.universo.id);

				if (!Object.keys(vm.filtros).length && vm.grupoFiltro.id == "QUESTOES") {
					vm.onGrupoFiltroAtivoInvalido();
				}
			}
			
			function limparFiltros() {
				if (vm.grupoFiltro.id == 'QUESTOES') {
					vm.onGrupoFiltroAtivoInvalido();
				}
				vm.filtros = tecDadosGeradorFiltros.limparFiltros(vm.filtros);
				$timeout(function() {
					$scope.$apply();
					$(window).scroll()
				});
			}
			
			//private functions
			function atualizarContagemQuestoes() {
				// Reinicia o timer a cada alteração; só dispara a consulta quando o
				// usuário para de mexer nos filtros por DEBOUNCE_CONTAGEM_MS.
				if (timerContagem) {
					$timeout.cancel(timerContagem);
				}
				timerContagem = $timeout(function() {
					timerContagem = null;
					executarContagemQuestoes();
				}, DEBOUNCE_CONTAGEM_MS);
			}

			function executarContagemQuestoes() {
				// Aborta a contagem anterior que ainda esteja em andamento no banco.
				if (cancelarContagemEmVoo) {
					cancelarContagemEmVoo.resolve();
					cancelarContagemEmVoo = null;
				}

				var canceler = $q.defer();
				cancelarContagemEmVoo = canceler;

				tecDadosGeradorFiltros.contarQuestoes(vm.universo, vm.formato, vm.filtros, vm.gerarEmSerie, vm.opcoes.caderno, canceler.promise)
				.then(function(numeroQuestoes) {
					if (cancelarContagemEmVoo === canceler) {
						cancelarContagemEmVoo = null;
					}
					vm.numeroQuestoesEncontradas = numeroQuestoes;
					vm.onAlteracaoNumeroQuestoesEncontradas({ numeroQuestoesEncontradas: numeroQuestoes });
				})
				// Contagem cancelada/superada por outra mais recente: ignora silenciosamente.
				.catch(angular.noop);
			}
		}
	});
});

module.directive("tecGeradorBuscador", function(tec, tecDadosGerador) {
	// vide directive "tecArvore" para explicação sobre os parâmetros "-ref"
	return tec.defaultDirective({
		scope: {
			titulo: "@",
			busca: "@",
			botaoBuscar: "@",
			placeholder: "@",
			maxlength: "@",
			desativarVirtualizacaoLista: "=",
			itens: "=",
			filtros: "=",
			universo: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			onAbrirPasta: "&",
			onFecharPasta: "&",
			onBuscaTexto: "&",
			resizeBuscador: "=",
			possuiGrupos: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-buscador">
				<tec-gerador-buscador-cabecalho
						titulo="vm.titulo"
						busca="vm.busca"
						botao-buscar="vm.botaoBuscar"
						placeholder="vm.placeholder"
						maxlength="vm.maxlength"
						on-busca-texto="vm.onBuscaTexto({ texto: texto, textoOriginal: textoOriginal })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador-cabecalho>

				<div class="arvore-wrapper">
					<div class="arvore-wrapper-canvas" ng-style="{ 'height': vm.scrollCanvasHeight || 'auto', 'padding-top': vm.scrollAlturaItensInvisiveis }">
						<tec-arvore
							itens="vm.scrollItensVisiveis"
							filtros="vm.filtros"
							on-click-item="vm.notificarClickItem(item)"
							on-click-pasta="vm.notificarClickPasta(pasta)"
							on-click-item-ref="vm.notificarClickItem"
							on-click-pasta-ref="vm.notificarClickPasta"
							possui-grupos="vm.possuiGrupos">
						</tec-arvore>
					</div>
				</div>
			</div>
		**/}),
		link: function(scope, element, attrs) {
			var virtualizacaoAtiva = !scope.vm.desativarVirtualizacaoLista;
			if (virtualizacaoAtiva) {
				$(element).find(".arvore-wrapper")[0].addEventListener('scroll', scope.vm.onScroll);
			}

			document.addEventListener('keydown', scope.vm.onKeydown);
		},
		controller: function($scope, $element, $timeout) {
			var vm = this;
			vm.scrollTop = 0;
			vm.scrollCanvasHeight = 0;
			vm.wrapperHeight = 0;
			vm.scrollCache = [];
			vm.scrollItensVisiveis = [];
			vm.scrollAlturaItensInvisiveis = 0;
			vm.notificarClickItem = notificarClickItem;
			vm.notificarClickPasta = notificarClickPasta;
			vm.onScroll = onScroll;
			vm.onKeydown = onKeydown;
			vm.atualizarScrollCache = atualizarScrollCache;
			vm.atualizarItensVisiveis = atualizarItensVisiveis;

			ativar();

			function ativar() {
				if (vm.desativarVirtualizacaoLista) {
					ativarSemVirtualizacao();
				} else {
					ativarComVirtualizacao();				
				}
			}

			function ativarSemVirtualizacao() {
				$scope.$watch("vm.itens", function(itens) {
					vm.scrollItensVisiveis = vm.itens;
				});
			}

			function ativarComVirtualizacao() {
				$scope.$watch("vm.itens", function(itens) {
					if (itens && itens.length) {
						vm.atualizarScrollCache();
					}
				});

				vm.wrapperHeight = $($element).find(".arvore-wrapper").first().height();
			}
			
			function notificarClickItem(item) {
				var filtrosTipo = vm.filtros[item.tipo] || {};
				var selecionar = !filtrosTipo[item.id];

				if (selecionar) {
					if (verificarLimiteFiltros(item.tipo, filtrosTipo)) {
						vm.onFiltroAdicionado({ filtro: item });
					}
				} else {
					vm.onFiltroRemovido({ filtro: item });
				}
			}

			function verificarLimiteFiltros(tipo, filtrosTipo) {
				var limite = -1;
				var quantidadeFiltros = 0;
				var tipoFiltro = "";

				switch(tipo) {
					case "BANCA":
						limite = 20;
						quantidadeFiltros = Object.keys(vm.filtros["BANCA"] || {}).length;
						tipoFiltro = "Banca";
						break;
					case "ORGAO":
					case "CARGO":
						limite = 50;
						quantidadeFiltros = Object.keys(vm.filtros["ORGAO"] || {}).length
											+ Object.keys(vm.filtros["CARGO"] || {}).length;
						tipoFiltro = "Órgão e cargo";
						break;
					case "MATERIA":
					case "ASSUNTO":
					case "SEM_CLASSIFICACAO_ASSUNTO":
						limite = 300;
						quantidadeFiltros = Object.keys(vm.filtros["MATERIA"] || {}).length
											+ Object.keys(vm.filtros["ASSUNTO"] || {}).length
											+ Object.keys(vm.filtros["SEM_CLASSIFICACAO_ASSUNTO"] || {}).length;
						tipoFiltro = "Matéria e assunto";
						break;
				}

				if (limite > 0 && quantidadeFiltros >= limite) {
					tec.alert('Você atingiu o limite de filtros do tipo "' + tipoFiltro + '".', 'Limite de filtros atigindo');
					return false;
				}

				return true;
			}
			
			function notificarClickPasta(pasta) {
				pasta.pastaAberta = !pasta.pastaAberta;
				if (pasta.pastaAberta) {
					var promiseAbrirPasta = vm.onAbrirPasta({ pasta: pasta });
					if (promiseAbrirPasta && promiseAbrirPasta.then) {
						promiseAbrirPasta.then(vm.atualizarScrollCache);
					} else {
						vm.atualizarScrollCache();
					}
				} else {
					vm.onFecharPasta({ pasta: pasta })
					vm.atualizarScrollCache();
				}
			}

			function atualizarScrollCache() {
				if (vm.desativarVirtualizacaoLista) return;

				if (!vm.itens || !vm.itens.length) return;
				
				vm.scrollCache = [];
				vm.itens.forEach(function(item) {
					var altura = calcularAlturaEmItensSubArvore(item);
					vm.scrollCache.push(altura * TEC_ARVORE_GERADOR_ITEM_HEIGHT_PX);
				});

				vm.scrollCanvasHeight = vm.scrollCache.reduce(function(item, total) {
					return total + item;
				}, 0);

				vm.atualizarItensVisiveis();
			}

			function calcularAlturaEmItensSubArvore(item) {
				if (!item.temFilhos) return 1;

				// tem filhos mas não carregou ainda
				if (!item.subTree || !item.subTree.length) return 1;

				if (!item.pastaAberta) return 1;

				var altura = 1;
				item.subTree.forEach(function (item) {
					altura += calcularAlturaEmItensSubArvore(item);
				})
				return altura;
			}

			function atualizarItensVisiveis() {
				// virtualização da parte superior estava causando
	 	        // scroll infinito para cima.				
	 	        // var comecoJanela = vm.scrollTop - 1 * TEC_ARVORE_GERADOR_ITEM_HEIGHT_PX; 
				var comecoJanela = 0;
				var fimJanela = vm.scrollTop + vm.wrapperHeight + 1 * TEC_ARVORE_GERADOR_ITEM_HEIGHT_PX;

				var itensVisiveis = [];
				var alturaItensInvisiveis = 0;
				
				var alturaAtual = 0;
				vm.scrollCache.forEach(function(item, i) {
					var comecoItemDentroJanela = alturaAtual >= comecoJanela && alturaAtual < fimJanela;
					var parteItemDentroJanela = alturaAtual < comecoJanela && (alturaAtual + item) >= comecoJanela;
					var itemVisivel = comecoItemDentroJanela || parteItemDentroJanela;
					var itemInvisivelAcimaJanela = !itemVisivel && alturaAtual < fimJanela;
					
					if (itemVisivel || vm.universo.id == 'PASTAS') {
						itensVisiveis.push(vm.itens[i]);
					} else if (itemInvisivelAcimaJanela) {
						alturaItensInvisiveis += item;
					}

					alturaAtual += item;
				})

				vm.scrollItensVisiveis = itensVisiveis;
				vm.scrollAlturaItensInvisiveis = alturaItensInvisiveis;
			}

			function onKeydown(e) {
				if (!$($element).is(":visible")) return;

				if (!vm.itens || !vm.itens.length) return;

				var char = String.fromCharCode(e.which).toLowerCase();

				var altura = 0;
				var encontrado = false;
				for (var i = 0; i < vm.itens.length; i++) {
					if (vm.itens[i].nome.charAt(0).toLowerCase() == char) {
						encontrado = true;
						break;
					}
					altura += vm.desativarVirtualizacaoLista ? TEC_ARVORE_GERADOR_ITEM_HEIGHT_PX : vm.scrollCache[i];
				};

				if (encontrado) {
					$($element).find(".arvore-wrapper").scrollTop(altura);
				}
			}

			function onScroll() {
				vm.scrollTop = $($element).find(".arvore-wrapper").first().prop('scrollTop');
				vm.atualizarItensVisiveis();
				$scope.$apply();
			}
		}
	});
});

module.directive("tecGeradorBuscadorCabecalho", function(tec) {
	return tec.defaultDirective({
		scope: {
			titulo: "=",
			busca: "=",
			botaoBuscar: "=",
			placeholder: "=",
			onBuscaTexto: "&",
			resizeBuscador: "=",
			maxlength: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-buscador-cabecalho">
				<span class="gerador-buscador-cabecalho-busca" ng-if="vm.botaoBuscar">
					<div class="input-group">
						<input type="text" 
							name="campoPesquisa"
							tec-bloquear-keydown
							class="form-control" 
							placeholder={{vm.placeholder}} 
							maxlength={{vm.maxlength}}
							aria-label={{vm.placeholder}} 
							aria-describedby="button-search"
							ng-model="vm.textoBusca"
							ng-model-options="{ debounce: 500 }"
							ng-keydown="$event.keyCode === 13 && vm.alterarTextoBusca(vm.textoBusca)"
							tec-auto-focus />
						<span 
							class="input-group-addon btn btn-tec"
							id="button-search"
							ng-disabled="!vm.textoBusca || vm.textoBusca.length < 3"
							disabled="disabled"
							ng-click="vm.alterarTextoBusca(vm.textoBusca)"
						>
							Buscar
						</span>
					</div>
				</span>
				<span class="gerador-buscador-cabecalho-titulo hidden-xs" ng-if="!vm.exibirBusca && !vm.botaoBuscar">
					{{vm.titulo}}
				</span>				
				<span class="gerador-buscador-cabecalho-busca" ng-if="vm.busca && !vm.botaoBuscar">
					<a ng-click="vm.exibirBusca = true" ng-if="!vm.exibirBusca" class="link-limpo" >
						Pesquisar por nome
					</a>
					<div class="input-group" ng-if="vm.exibirBusca">
						<span class="input-group-addon" >Nome:</span>
						<input type="text"
								tec-bloquear-keydown
								name="campoPesquisa"
								class="form-control"
								placeholder="Digite pelo menos três caracteres"
								maxlength=""
								ng-model="vm.textoBusca"
								ng-model-options="{ debounce: 500 }"
								ng-change="vm.alterarTextoBusca(vm.textoBusca)"
								tec-auto-focus />
					</div>
				</span>
				<a class="gerador-buscador-cabecalho-busca-limpar"
						ng-if="vm.busca && vm.exibirBusca"
						ng-click="vm.limparTextoBusca()"
						tec-click-when-key="27" >
					voltar
				</a>
				<span class="gerador-buscador-cabecalho-resizer glyphicon glyphicon-resize-horizontal hidden-xs" ng-click="vm.alternarLarguraBuscador()" title="Alternar largura"></span>
			</div>
		**/}),
		controller: function() {
			var vm = this;
			vm.alterarTextoBusca = alterarTextoBusca;
			vm.limparTextoBusca = limparTextoBusca;
			vm.alternarLarguraBuscador = alternarLarguraBuscador;
			
			function alterarTextoBusca(texto) {
				texto = texto || "";
				var textoBusca = $.removerNaoAscii(texto.toLowerCase());
				textoBusca = (textoBusca && textoBusca.length >= 3) ? textoBusca : "";
				vm.onBuscaTexto({ texto: textoBusca, textoOriginal: texto });
			}
			
			function limparTextoBusca() {
				vm.exibirBusca = false;
				vm.textoBusca = null;
				alterarTextoBusca(null);
			}
			
			function alternarLarguraBuscador() {
				vm.resizeBuscador = !vm.resizeBuscador;
			}
		}
	});
});

module.directive("tecBloquearKeydown", function () {
	return {
		restrict: "A",
		scope: {
			tecBarreiraEventos: "@"
		},
		link: function(scope, element, attrs) {
			$(element).bind("keydown", function(e) {
				e.stopPropagation();
			});
		}
	}
});

module.directive("tecGeradorFiltrador", function(tec, tecDadosGeradorFiltros, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			opcoes: "=",
			universo: "=",
			formato: "=",
			filtros: "=",
			filtrosAtalho: "=",
			numeroQuestoesEncontradas: "=",
			gerarEmSerie: "=",
			onFiltroRemovido: "&",
			onFiltroAdicionado: "&",
			onLimparFiltros: "&",
			mobile: "=",
			configurarCaderno: "=",
			resizeBuscador: "=",
			naoExibirConfigurarCaderno: "=",
			onExibirConfigurarCaderno: "=",
			configurarCadernoDesbloqueada: "="
		},
		template: tec.multiline(function() {/**
		<div ng-class="{'somente-mobile': vm.mobile}">
			<!-- DESKTOP -->
			<div class="gerador-filtrador somente-desktop">
				<div class="gerador-filtrador-cabecalho" aria-live="polite">
					<span class="gerador-filtrador-cabecalho-titulo hidden-xs" >
						Filtros ativos: <strong>{{ vm.itensVisiveis.length }}</strong>
					</span>
					<div class='gerador-filtrador-cabecalho-filtros-salvos'>
						<a class="gerador-filtrador-cabecalho-limpar link-limpo"
								ng-show="vm.itensVisiveis.length > 1"
								ng-click="vm.onLimparFiltros()" >
							Limpar <span class="hidden-sm hidden-md">todos</span>
							<span class="glyphicon glyphicon-remove" ng-click="vm.onLimparFiltros();"></span>
						</a>
						<a class="gerador-filtrador-cabecalho-salvar link-limpo"
								ng-show="vm.itensVisiveis.length > 0"
								ng-click="vm.salvarFiltros()" >
							Salvar
							<span class="glyphicon glyphicon-save" ng-click="vm.salvarFiltros();"></span>
						</a>
						<a class="gerador-filtrador-cabecalho-carregar link-limpo" ng-click="vm.abrirMenuFiltrosSalvos()"
							tec-menu-lateral-trigger="{ target: '#sub-menu-filtros-salvos', scrollbar: 'visivel' }">
							Carregar
							<span class="glyphicon glyphicon-open" ng-click="vm.abrirMenuFiltrosSalvos();"></span>
						</a>
					</div>
				</div>

				<div class="arvore" >
					<ul>
						<li class="arvore-item" ng-repeat="filtro in vm.itensVisiveis">
							<div class="arvore-item-conteudo" ng-hide="(filtro.hide)">
								<span class="arvore-item-icone-nome-wrap" >
									<span class="arvore-item-icone" ng-click="vm.onFiltroRemovido({ filtro: filtro })"></span>
									<span title = "{{filtro.tipoDescricao}}: {{filtro.tipo == 'SEM_CLASSIFICACAO_ASSUNTO' ? filtro.materia : filtro.nomeOriginal || filtro.nome}}" class="arvore-item-nome " ng-click="vm.onFiltroRemovido({ filtro: filtro })" >{{filtro.tipoDescricao}}: {{filtro.tipo == 'SEM_CLASSIFICACAO_ASSUNTO' ? filtro.materia : filtro.nomeOriginal || filtro.nome}}</span>
								</span>
							</div>
						</li>
					</ul>

					<div ng-hide="vm.checarEsconderAtalhos()" class="atalhos-opcoes">
						<div class="titulo-atalhos">Opções</div>
						<div role="button" class="link-atalho" ng-hide="filtro.esconderAtalho" ng-click="vm.onFiltroAdicionado({filtro: filtro})" ng-repeat="filtro in vm.filtrosAtalho">{{filtro.nome}}</div>
					</div>
				</div>

				<div class="gerador-filtrador-rodape" >
					<div class="gerador-filtrador-conteudo-rodape-informacoes">
						<tec-gerador-filtrador-resultado
								numero-questoes="vm.numeroQuestoesEncontradas" 
								gerar-em-serie="vm.gerarEmSerie" >
						</tec-gerador-filtrador-resultado>
						<div class="gerador-filtrador-conteudo-rodape-configurar">
							<span ng-if="!vm.naoExibirConfigurarCaderno" >
								<a ng-click="vm.exibirConfiguracoes(true)" class="link-limpo"
									ng-class="{'inativo': !vm.configurarCadernoDesbloqueada && (!vm.itensVisiveis.length || vm.numeroQuestoesEncontradas == 0)}">
									Editar quantidades
								</a>
							</span>
						</div>
					</div>
					<div class="gerador-filtrador-conteudo-rodape-dificuldade" ng-hide="vm.resizeBuscador">
						<span ng-if="vm.formato.id == 'DISCURSIVA'" class="aviso-dificuldade-discursiva">
							Questões discursivas não têm classificação de dificuldade
						</span>
						<a ng-if="!vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'" ng-click="vm.calcularDificuldade()" class="link-limpo"
							ng-class="{'inativo': !vm.itensVisiveis.length || vm.numeroQuestoesEncontradas == 0}">
							Calcular dificuldade
						</a>
						<div class="cabecalho-dificuldade" ng-if="vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'">
							<span ng-class="{'invalido': vm.filtroAlterado}">{{vm.faixaDificuldade}}</span>
							<span class="fa fa-undo" ng-class="{'invalido': !vm.filtroAlterado || !vm.itensVisiveis.length || vm.numeroQuestoesEncontradas == 0 }" title="Recalcular dificuldade" ng-click="vm.calcularDificuldade()" tec-tooltip></span>
						</div>
						<div class="grafico-dificuldade-media" ng-if="vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'" ng-class="{'invalido': vm.filtroAlterado}" tec-tooltip="Dificuldade média do caderno: {{vm.dificuldadeMedia}}%">
							<div class="fundo-dificuldade"><div class="indicador-dificuldade" style="left: {{vm.dificuldadeMedia}}%"></div></div>
						</div>
					</div>
				</div>
			</div>

			<!-- MOBILE -->
			<div class="gerador-filtrador-mobile-ancora"></div>
			<div class="gerador-filtrador-mobile" ng-class="{expandido: vm.filtroMobileExpandido}">
				<div class="gerador-cabecalho-filtro">
					<div class="gerador-cabecalho-filtro-label">Filtros
						<span class="quantidade-selecionado" ng-if="vm.itensVisiveis.length > 0">{{vm.itensVisiveis.length}}</span>
					</div>

					<button class="gerador-cabecalho-filtro-carregar-filtros" ng-if="!vm.filtroMobileExpandido && vm.itensVisiveis.length === 0"
						ng-click="vm.abrirMenuFiltrosSalvos()" tec-menu-lateral-trigger="{ target: '#sub-menu-filtros-salvos', scrollbar: 'visivel' }">
						<span class="glyphicon glyphicon-open"></span> Carregar filtros salvos
					</button>

					<div class="gerador-cabecalho-filtro-atalhos" ng-if="!vm.filtroMobileExpandido && !vm.checarEsconderAtalhos()">
						<button ng-hide="filtro.esconderAtalho" ng-click="vm.onFiltroAdicionado({filtro: filtro})" ng-repeat="filtro in vm.filtrosAtalho">{{filtro.nome}}</button>
					</div>

					<div class="gerador-cabecalho-filtro-acoes-filtro-expandido" ng-if="vm.filtroMobileExpandido">
						<button class="gerador-cabecalho-filtro-limpar" ng-click="vm.onLimparFiltros()">
							<span class="glyphicon glyphicon-remove"></span> Limpar
						</button>
						<button class="gerador-cabecalho-filtro-salvar" ng-click="vm.salvarFiltros()">
							<span class="glyphicon glyphicon-save"></span> Salvar
						</button>
						<button class="gerador-cabecalho-filtro-carregar" ng-click="vm.abrirMenuFiltrosSalvos()"
							tec-menu-lateral-trigger="{ target: '#sub-menu-filtros-salvos', scrollbar: 'visivel' }">
							<span class="glyphicon glyphicon-open"></span> Carregar
						</button>
					</div>

					<button class="gerador-cabecalho-filtro-expandir" ng-if="vm.itensVisiveis.length > 0"
						ng-click="vm.toggleExpandirFiltrosAtivosMobile()">
						<span class="fa fa-sort"></span>
					</button>
				</div>

				<div class="gerador-filtro-expandido">
					<div class="arvore">
						<ul>
							<li class="arvore-item" ng-repeat="filtro in vm.itensVisiveis">
								<div class="arvore-item-conteudo" ng-hide="(filtro.hide)">
									<span class="arvore-item-icone-nome-wrap" >
										<span class="arvore-item-icone" ng-click="vm.onFiltroRemovido({ filtro: filtro })"></span>
										<span title = "{{filtro.tipoDescricao}}: {{filtro.tipo == 'SEM_CLASSIFICACAO_ASSUNTO' ? filtro.materia : filtro.nomeOriginal || filtro.nome}}" class="arvore-item-nome " ng-click="vm.onFiltroRemovido({ filtro: filtro })" >{{filtro.tipoDescricao}}: {{filtro.tipo == 'SEM_CLASSIFICACAO_ASSUNTO' ? filtro.materia : filtro.nomeOriginal || filtro.nome}}</span>
									</span>
								</div>
							</li>
						</ul>

						<div ng-hide="vm.checarEsconderAtalhos()" class="atalhos-opcoes">
							<div class="titulo-atalhos">Opções</div>
							<div role="button" class="link-atalho" ng-hide="filtro.esconderAtalho" ng-click="vm.onFiltroAdicionado({filtro: filtro})" ng-repeat="filtro in vm.filtrosAtalho">{{filtro.nome}}</div>
						</div>
					</div>
				</div>

				<div class="gerador-resumo-resultado">
					<div class="gerador-resumo-resultado-total">
						<div class="total">{{vm.numeroQuestoesEncontradas}}</div>
						<div>questões</div>
					</div>
					<div class="gerador-filtrador-conteudo-rodape-dificuldade" ng-if="vm.itensVisiveis.length > 0">
						<span ng-if="vm.formato.id == 'DISCURSIVA'" class="aviso-dificuldade-discursiva">
							Questões discursivas não têm classificação de dificuldade
						</span>
						<a ng-if="!vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'" ng-click="vm.calcularDificuldade()" class="link-limpo"
							ng-class="{'inativo': !vm.itensVisiveis.length || vm.numeroQuestoesEncontradas == 0}">
							Calcular dificuldade
						</a>
						<div class="cabecalho-dificuldade" ng-if="vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'">
							<span ng-class="{'invalido': vm.filtroAlterado}">{{vm.faixaDificuldade}}</span>
							<span class="fa fa-undo" ng-class="{'invalido': !vm.filtroAlterado || !vm.itensVisiveis.length || vm.numeroQuestoesEncontradas == 0 }" title="Recalcular dificuldade" ng-click="vm.calcularDificuldade()" tec-tooltip></span>
						</div>
						<div class="grafico-dificuldade-media" ng-if="vm.exibirDificuldade && vm.formato.id != 'DISCURSIVA'" ng-class="{'invalido': vm.filtroAlterado}" tec-tooltip="Dificuldade média do caderno: {{vm.dificuldadeMedia}}%">
							<div class="fundo-dificuldade"><div class="indicador-dificuldade" style="left: {{vm.dificuldadeMedia}}%"></div></div>
						</div>
					</div>
					<div class="gerador-resumo-resultado-acao" ng-if="vm.opcoes.universoSelecionado.id != 'PASTAS' && vm.opcoes.caderno === undefined">
						<button class="btn btn-tec" ng-disabled="vm.itensVisiveis.length === 0 || vm.numeroQuestoesEncontradas === 0" ng-click="vm.resolverQuestoesMobile()">Resolver</button>
					</div>
				</div>
			</div>

			<!-- Menu lateral filtros salvos -->
			<div tec-menu-lateral="{ sentido: 'direita' }" id="sub-menu-filtros-salvos">
				<div class="header-filtros-salvos">
					Filtros salvos
					<button type="button" class="close" aria-label="Close" ng-click="vm.fecharMenuFiltros()">
						<span aria-label="Fechar janela">
							<span id="" class="glyphicon glyphicon-remove" title=""></span>
						</span>
					</button>
				</div>
				<div class="filtro-salvo" ng-repeat="filtro in vm.filtrosSalvos track by filtro.id">
					<div class="filtro-info">
						<div class="nome-filtro">{{filtro.nome}}</div>
						<div class="acoes-filtro">
							<a role="button" ng-click="vm.renomearFiltro(filtro)">Renomear</a> <span class="separador-texto">●</span> <a class="excluir-filtro" role="button" ng-click="vm.excluirFiltro(filtro)">Excluir</a>
						</div>
					</div>
					<div class="carregar-filtro">
						<button class="btn btn-tec" ng-click="vm.carregarFiltro(filtro)" ng-disabled="vm.carregandoFiltros">Carregar</button>
					</div>
				</div>
			</div>
		</div>
		**/}),
		controller: function($scope, $timeout, tecDadosGerador) {
			var vm = this;
			vm.tratarOverflowFiltros = tratarOverflowFiltros;
			vm.alternarExpansaoFiltros = alternarExpansaoFiltros;
			vm.exibirConfiguracoes = exibirConfiguracoes;
			vm.calcularDificuldade = calcularDificuldade;
			vm.abrirMenuFiltrosSalvos = abrirMenuFiltrosSalvos;
			vm.salvarFiltros = salvarFiltros;
			vm.fecharMenuFiltros = fecharMenuFiltros;
			vm.renomearFiltro = renomearFiltro;
			vm.excluirFiltro = excluirFiltro;
			vm.carregarFiltro = carregarFiltro;
			vm.executarFiltros = executarFiltros;
			vm.checarEsconderAtalhos = checarEsconderAtalhos;
			vm.toggleExpandirFiltrosAtivosMobile = toggleExpandirFiltrosAtivosMobile;
			vm.resolverQuestoesMobile = resolverQuestoesMobile;
			vm.carregandoFiltros = false;
			vm.possuiFiltroSomenteAdaptasIneditas = false;
			vm.exibirDificuldade = false;
			vm.dificuldadeMedia = 60;
			vm.filtroAlterado = false;

			vm.filtrosSalvos = [];

			vm.filtroMobileExpandido = false;

			ativar();
			
			function ativar() {
				$scope.$watch("vm.filtros", function(filtros) {
					if (filtros) {
						vm.itens = tecDadosGeradorFiltros.mapFiltrosParaArray(filtros);
						vm.itensVisiveis = tecDadosGeradorFiltros.somenteFiltrosVisiveis(filtros);
						if (!vm.itens.length) {
							vm.expandirFiltros = false;
							vm.filtroMobileExpandido = false;
						}
					}

					vm.filtroAlterado = true;
				});

				if (vm.mobile) {
					var ancora = $(".gerador-filtrador-mobile-ancora")[0];
					var sticky = $(".gerador-filtrador-mobile")[0];
					vm.observerMobile = new IntersectionObserver(
						function(entries) {
							angular.forEach(entries, function(e) {
								if(e.intersectionRatio === 1 && !vm.filtroMobileExpandido) {
									sticky.classList.add("fixar");
									ancora.classList.add("fixar");
								} else if (e.boundingClientRect.bottom > 0) {
									// só flutua se a ancora estiver abaixo da tela
									sticky.classList.remove("fixar");
									ancora.classList.remove("fixar");
								}
							});
						},
						{ threshold: [1], rootMargin: "0px 0px -120px 0px" } // 120px é o tamanho da seção quando está flutuando
					);

					vm.observerMobile.observe(ancora);
				}
			}

			function toggleExpandirFiltrosAtivosMobile() {
				vm.filtroMobileExpandido = !vm.filtroMobileExpandido;
				var isApp = $.isApp();
				if (vm.filtroMobileExpandido && isApp) {
					$("#header").removeClass("header-fixed");					
				} else if (!vm.filtroMobileExpandido && isApp) {
					$("#header").addClass("header-fixed");			
				}
				if (!vm.filtroMobileExpandido && !!vm.observerMobile) {
					var ancora = $(".gerador-filtrador-mobile-ancora")[0];
					vm.observerMobile.unobserve(ancora);
					vm.observerMobile.observe(ancora);
				}
			}

			function tratarOverflowFiltros(overflow) {
				vm.ocultarFiltros = overflow;
			}
			
			function alternarExpansaoFiltros(expandir) {
				vm.expandirFiltros = expandir;
				$timeout(function() {
					$scope.$apply();
					$(window).scroll()
					if (expandir) {
						tec.scroll(".gerador-filtrador-conteudo-expandido", {
							dontScrollIfIntoView: true,
							scrollToBottom: true
						});
					}
				});
			}
			
			function exibirConfiguracoes(flag) {
				if (vm.configurarCaderno !== flag) {
					if (flag && vm.numeroQuestoesEncontradas > 100000) {
						var mensagem = "A edição de quantidades só pode ser feita quando o filtro retornar, no máximo, <b>100 mil questões</b>. Para continuar, ajuste os filtros até que a quantidade fique dentro desse limite.";
						tec.alert(mensagem, "Limite para Editar Quantidades Excedido");
						return;
					}

					vm.configurarCaderno = flag;
					vm.atualizarConfiguracoes = true;

					if (vm.onExibirConfigurarCaderno) {
						vm.onExibirConfigurarCaderno({ abriu: flag });
					}
				}
			}

			function calcularDificuldade() {
				if (!$.isAssinanteLogado())  {
					tec.alert("Esta funcionalidade está disponível somente para assinantes. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo para assinantes");
					return;
				}

				if (!vm.itensVisiveis.length || vm.numeroQuestoesEncontradas === 0) {
					return;
				} else if (vm.numeroQuestoesEncontradas > 10000) {
					var mensagem = "O cálculo de dificuldade só pode ser feito quando o filtro retornar, no máximo, <b>10 mil questões</b>. Para continuar, ajuste os filtros até que a quantidade fique dentro desse limite.";
					tec.alert(mensagem, "Limite para Calcular Dificuldade Excedido");
					return;
				}

				tecDadosGeradorFiltros.calcularDificuldade(vm.universo, vm.formato, vm.filtros, vm.gerarEmSerie)
				.then(function(dificuldade) {
					if (dificuldade >= 0) {
						vm.dificuldadeMedia = Math.round(dificuldade);
                        vm.faixaDificuldade = obterFaixaDificuldade(vm.dificuldadeMedia);
                        vm.exibirDificuldade = true;
                        vm.filtroAlterado = false;
					}
				});
			}

			function obterFaixaDificuldade(dificuldade) {
				if (dificuldade <= 20.0) {
					return "Muito fácil";
				} else if (dificuldade <= 40.0) {
					return "Fácil";
				} else if (dificuldade <= 60.0) {
					return "Médio";
				} else if (dificuldade <= 80.0) {
					return "Difícil";
				} else {
					return "Muito difícil";
				}
			}

			function fecharMenuFiltros() {
				$timeout(function() {
					angular.element(".offcanvas-overlay").click();
				}, 0);
			}

			function checarEsconderAtalhos(filtro) {
				if (!vm.itensVisiveis.length || vm.formato.id === 'DISCURSIVA') {
					return true;
				}

				var esconder = true;
				angular.forEach(vm.filtrosAtalho, function(filtro) {
					esconder &&= filtro.esconderAtalho;
				});

				return esconder;
			}

			function salvarFiltros() {
				tec.prompt("Digite um nome descritivo para esta seleção de filtros.", "", "Salvar filtros", function(nome) {
					if (!nome || !nome.length) {
						tec.alert('<span class="glyphicon glyphicon-remove-sign icone-alerta-filtros"></span> Seleção não foi salva.', "Salvar filtros");
						return;
					}

					tecDadosGeradorFiltros.salvarFiltros(nome, vm.universo, vm.formato, vm.itens)
						.then(function () {
							tec.alert('<span class="glyphicon glyphicon-ok-sign icone-alerta-filtros"></span> A seleção <strong>' + nome + "</strong> foi salva com sucesso.", "Salvar filtros");
						})
						.catch(function () {
							tec.alert('<span class="glyphicon glyphicon-remove-sign icone-alerta-filtros"></span> Não foi possível salvar a seleção.', "Salvar filtros");
						});
				});
			}

			function abrirMenuFiltrosSalvos() {
				tecDadosGeradorFiltros.buscarFiltrosSalvos(vm.universo, vm.formato)
					.then(function (dados) {
						vm.filtrosSalvos = dados;
					});
			}

			function renomearFiltro(filtro) {
				tec.prompt("Digite o novo nome desta seleção de filtros.", filtro.nome, "Renomear", function(nome) {
					if (!nome || !nome.length) {
						tec.alert('<span class="glyphicon glyphicon-remove-sign icone-alerta-filtros"></span> Filtro não foi renomeado.', "Renomear");
						return;
					}

					var nomeAntigo = filtro.nome;
					filtro.nome = nome;

					tecDadosGeradorFiltros.alterarFiltroSalvo(filtro)
						.then(function () {
							tec.alert('<span class="glyphicon glyphicon-ok-sign icone-alerta-filtros"></span> Seleção renomeada para <strong>' + nome + "</strong>.", "Renomear");
						})
						.catch(function () {
							tec.alert('<span class="glyphicon glyphicon-remove-sign icone-alerta-filtros"></span> Não foi possível renomear a seleção.', "Renomear");
							filtro.nome = nomeAntigo;
						});
				});
			}

			function excluirFiltro(filtro) {
				tec.confirm("Tem certeza que deseja excluir <strong>" + filtro.nome + "</strong>? Esta ação é irreversível.", "Excluir", function(excluir) {
					if (!excluir) {
						return;
					}

					tecDadosGeradorFiltros.excluirFiltroSalvo(filtro)
						.then(function () {
							tec.alert('<span class="glyphicon glyphicon-ok-sign icone-alerta-filtros"></span> <strong>' + filtro.nome + "</strong> excluído com sucesso.", "Excluir");

							var index = vm.filtrosSalvos.indexOf(filtro);

							if(index !== -1) {
								vm.filtrosSalvos.splice(index, 1);
							}
						})
						.catch(function () {
							tec.alert('<span class="glyphicon glyphicon-remove-sign icone-alerta-filtros"></span> Não foi possível excluir a seleção.', "Excluir");
						});
				});
			}

			function carregarFiltro(filtro) {
				if (vm.itensVisiveis.length > 0) {
					tec.confirm("Você irá perder os filtros selecionados. Deseja continuar?", "Carregar filtros", function(confirmou) {
						if (confirmou) {
							vm.executarFiltros(filtro);
						}
					});
				}
				else {
					vm.executarFiltros(filtro);
				}
			}

			function executarFiltros(filtro) {
				vm.carregandoFiltros = true;
				vm.onLimparFiltros();

				tecDadosGeradorFiltros.buscarDadosFiltroSalvo(filtro)
					.then(function (filtro) {
						jsonAssuntosPorMateria = JSON.parse(filtro.jsonAssuntosPorMateria);
						tecDadosBuscadores.carregarAssuntosDeCadernoBase(tecDadosBuscadores.materias, jsonAssuntosPorMateria);

						jsonCargosPorOrgao = JSON.parse(filtro.jsonCargosPorOrgao);
						tecDadosBuscadores.carregarCargosDeCadernoBase(tecDadosBuscadores.orgaos, jsonCargosPorOrgao);

						jsonFiltrosGeracao = JSON.parse(filtro.jsonFiltrosGeracao);

						var filtrosMap = tecDadosBuscadores.carregarFiltrosDoCadernoBase();
						var adaptadasIneditas = false;

						var filtrosCarregados = [];
						var promises = [];
						angular.forEach(filtrosMap, function(filtros) {
							angular.forEach(filtros, function(filtro) {
								adaptadasIneditas = (adaptadasIneditas == false && filtro.id == "SOMENTE_ADAPTADAS_INEDITAS") ? true : adaptadasIneditas;

								vm.filtros = tecDadosGeradorFiltros.copiarFiltros(vm.filtros);
								tecDadosGeradorFiltros.adicionarFiltro(vm.filtros, filtro, true);
							});
						});
						var filtroFormato = filtro.formato ? filtro.formato : 'OBJETIVA';
						var formato = (filtroFormato == 'OBJETIVA' && adaptadasIneditas) ? 'OBJETIVA_INEDITAS' : filtroFormato;
						vm.formato = tecDadosGerador.getFormatoQuestao(formato);
						fecharMenuFiltros();

						tec.alert("O filtro <strong>" + filtro.nome + "</strong> foi carregado.", "Carregar filtros");
						vm.carregandoFiltros = false;
					});
			}

			function resolverQuestoesMobile() {
				if(!!vm.opcoes.onResolverQuestoes) {
					$(".gerador-filtrador-mobile").removeClass("fixar");
					vm.opcoes.onResolverQuestoes();
				}
			}
		}
	});
});

module.directive("tecGeradorFiltradorFiltrosResumo", function(tec) {
	return tec.defaultDirective({
		scope: {
			filtros: "=",
			expandido: "=",
			overflowFiltros: "=",
			onAlternarExpansao: "&",
			onLimparFiltros: "&",
			salvarFiltros: "&",
			abrirMenuFiltrosSalvos: "&",
			checarEsconderAtalhos: "&",
			onFiltroAdicionado: "&",
			filtrosAtalho: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-filtrador-filtros-resumo">
				<span ng-if="vm.filtros.length">
					Você inseriu
					<span ng-if="vm.filtros.length > 1">{{vm.filtros.length}} filtros.</span>
					<span ng-if="vm.filtros.length == 1">um filtro.</span>

					<div ng-hide="vm.checarEsconderAtalhos()" class="atalhos-opcoes">
						<div class="titulo-atalhos">Opções</div>
						<div role="button" class="link-atalho" ng-hide="filtro.esconderAtalho" ng-click="vm.onFiltroAdicionado({filtro: filtro})" ng-repeat="filtro in vm.filtrosAtalho">{{filtro.nome}}</div>
					</div>

					<div class="opcoes-filtrador-resumo">
						<a ng-click="vm.onAlternarExpansao({ expandir: true })" ng-if="!vm.expandido && vm.overflowFiltros" class="link-limpo">
							<span class="glyphicon glyphicon-eye-open" ng-click="vm.onAlternarExpansao({ expandir: true })"></span> Ver filtros ativos
						</a>
						<a ng-click="vm.onAlternarExpansao({ expandir: false })" ng-if="vm.expandido" class="link-limpo">
							<span class="glyphicon glyphicon-eye-close" ng-click="vm.onAlternarExpansao({ expandir: false })"></span> Ocultar filtros ativos
						</a>
						<a ng-click="vm.onLimparFiltros()" class="link-limpo">
							<span class="glyphicon glyphicon-remove" ng-click="vm.onLimparFiltros()"></span> Limpar filtros ativos
						</a>
						<a ng-click="vm.salvarFiltros()" class="link-limpo">
							<span class="glyphicon glyphicon-save" ng-click="vm.salvarFiltros()"></span> Salvar filtros ativos
						</a>
						<a ng-click="vm.abrirMenuFiltrosSalvos()" tec-menu-lateral-trigger="{ target: '#sub-menu-filtros-salvos', scrollbar: 'visivel' }" class="link-limpo">
							<span class="glyphicon glyphicon-open" ng-click="vm.abrirMenuFiltrosSalvos()"></span> Carregar filtros salvos
						</a>
					</div>
				</span>
				<span ng-if="!vm.filtros.length">
					<span class="hidden-xs">Utilize os filtros acima para montar seu caderno.</span>
					<span class="visible-xs">Monte seu caderno com os filtros acima.</span>
					<a ng-click="vm.abrirMenuFiltrosSalvos()" tec-menu-lateral-trigger="{ target: '#sub-menu-filtros-salvos', scrollbar: 'visivel' }" class="link-limpo">
						<span class="glyphicon glyphicon-open" ng-click="vm.abrirMenuFiltrosSalvos()"></span> Carregar filtros salvos
					</a>
				</span>
			</div>
		**/})
	});
});

module.directive("tecGeradorFiltradorResultado", function(tec) {
	return tec.defaultDirective({
		scope: {
			numeroQuestoes: "=",
			gerarEmSerie: "=",
			ocultar: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-filtrador-resultado" aria-live="polite">
				<span ng-if="!vm.ocultar" >
					<span ng-if="vm.numeroQuestoes != 1">
						<strong>{{vm.numeroQuestoes}}</strong> questões
						<span ng-if="!vm.gerarEmSerie" class="hidden-xs encontradas"> encontradas</span>
						<span ng-if="vm.gerarEmSerie" class="hidden-xs encontradas"> restantes</span>
					</span>
					<span ng-if="vm.numeroQuestoes == 1">
						<strong>uma</strong> questão
						<span ng-if="!vm.gerarEmSerie" class="hidden-xs encontrada"> encontrada</span>
						<span ng-if="vm.gerarEmSerie" class="hidden-xs encontrada"> restante</span>
					</span>
				</span>
			</div>
		**/})
	});
});

module.directive("tecGeradorCaderno", function(tec) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			opcoes: "=",
			filtros: "=",
			numeroQuestoesEncontradas: "=",
			materias: "=",
			listaAssuntos: "=",
			matrizAssuntos: "=",
			totalQuestoesSelecionadas: "=",
			configurarCaderno: "=",
			gerarEmSerie: "=",
			cadernosGerados: "=",
			arvoreAssuntos: "=",
			caderno: "=",
			atualizarConfiguracoes: "=",
			formaEscolherQuestoes: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-caderno">
				<form id="geradorForm" action="" method="post">
					<button type="submit" onclick="return false;" style="display:none;"><!-- impede enter fazer submit do form --></button>

					<input type="hidden" name="caderno" value="{{vm.caderno}}" />
					<input type="hidden" name="universo" value="{{vm.universo.id}}" />
					<input type="hidden" name="formato" value="{{vm.formato.id}}" />
					<input type="hidden" name="formaEscolherQuestoes" value="{{vm.formaEscolherQuestoes}}" />

					<span class="gerador-caderno-filtro" ng-repeat="filtro in vm.arrayFiltros">
						<input type="hidden" name="filtros[{{$index}}].tipo" value="{{filtro.tipo}}" />
						<input type="hidden" name="filtros[{{$index}}].id" value="{{filtro.id}}" />						
					</span>
					
					<span ng-repeat="materia in vm.materias" >
						<input type="hidden" name="materias[{{$index}}].id" value="{{materia.id}}" />
						<input type="hidden" name="materias[{{$index}}].numeroQuestoes" value="{{materia.numeroQuestoesCaderno}}" />
					</span>
					
					<span ng-repeat="assunto in vm.listaAssuntos">
						<input type="hidden" name="assuntos[{{$index}}].id" value="{{assunto.id}}" />
						<input type="hidden" name="assuntos[{{$index}}].numeroQuestoes" value="{{assunto.numeroQuestoesOriginal}}" />
						<input type="hidden" name="assuntos[{{$index}}].idMateria" value="{{assunto.materia.id}}"  />
					</span>
					
					<div class="gerador-caderno-grid">
						<div class="gerador-caderno-nome">
							<div class="form-group">
								<label for="nomeCadernoId">Nome do caderno</label>
								<input id="nomeCadernoId" type="text" name="nomeCaderno" ng-model="vm.nomeCaderno" ng-model-options="{ updateOn: 'blur' }" class="form-control" maxlength="150" tec-bloquear-keydown />
							</div>
						</div>
						<div class="gerador-caderno-pasta">
							<div class="form-group">
								<label for="pastaCadernosId">Pasta de destino</label>
								<select class="form-control" id="pastaCadernosId"
										ng-model="vm.pastaCadernosAtual"
										ng-options="pasta as pasta.nome for pasta in vm.pastasCadernos track by pasta.id">
								</select>
								<input type="hidden" name="pastaDestino" value="{{vm.pastaCadernosAtual.id}}" />
								<input type="hidden" name="abrirEmModoCurso" value="{{vm.pastaCadernosAtual.modoCurso}}" />
							</div>
						</div>
						<div class="gerador-caderno-gerar">
							<div class="form-group">
								<div class="hidden-xs">
									<label><input type="checkbox" class="caderno-em-serie" ng-model="vm.gerarEmSerie" ng-click="vm.onGerarEmSerie()" ng-disabled="vm.desabilitarGerarEmSerie()"/>Gerar <span class="hidden-sm">cadernos </span>em série</label>
									<span class="glyphicon glyphicon-info-sign informacao" tec-tooltip="{{ vm.caderno === undefined ? 'Marque para gerar cadernos sem repetir questões entre eles.' : 'Opção desativada na edição de caderno' }}" ></span>
								</div>

								<div class="gerar-caderno-total-questoes-mobile" ng-if="vm.universo.id != 'PASTAS' && vm.caderno === undefined">
									<label>
										<span>Total de questões</span>
										<input class="form-control" type="text" name="totalQuestoes" inputmode="numeric" pattern="[0-9]*"
											ng-model="vm.totalQuestoesSelecionadasMobile" ng-blur="vm.ajustarTotalQuestoesSelecionadasMobile()"/>
									</label>
									<p>O número de questões por matéria será alterado proporcionalmente. Para alterar o número de questões por matéria individualmente, use o site no computador.</p>
								</div>

								<button type="button" ng-if="!vm.exibirDelay" ng-disabled="!vm.nomeCaderno || (vm.arrayFiltros.length == 0 && vm.opcoes.universoSelecionado.id != 'PASTAS') || vm.numeroQuestoesEncontradas == 0 || vm.salvando" ng-click="vm.gerarCaderno()">{{ vm.caderno === undefined ? 'Gerar Caderno' : 'Salvar alterações' }}</button>
								<button type="button" ng-if="vm.exibirDelay" ng-disabled="true" ng-click="vm.gerarCaderno()">{{ vm.caderno === undefined ? 'Gerando Seu Caderno...' : 'Salvando alterações...' }}</button>
							</div>
						</div>
					</div>
				</form>
			</div>
		**/}),
		controller: function($scope, $timeout, tecDadosGerador, tecDadosGeradorFiltros) {
			var vm = this;
			vm.gerarCaderno = gerarCaderno;
			vm.salvando = false;
			vm.enviando = false;
			vm.onGerarEmSerie = onGerarEmSerie;
			vm.desabilitarGerarEmSerie = desabilitarGerarEmSerie;
			vm.ajustarTotalQuestoesSelecionadasMobile = ajustarTotalQuestoesSelecionadasMobile;
			vm.abrirEmModoCurso = false;
			vm.exibirDelay = false;
			ativar();

			function ativar() {
				vm.nomeCaderno = (typeof jsonCaderno != 'undefined') ? jsonCaderno.cadernoNome : "Caderno de Estudo";
				vm.totalQuestoesSelecionadasMobile = vm.numeroQuestoesEncontradas;

				//jsonPastaAtualId é passado quando o usuário abre o gerador de dentro de uma pasta
				var pastaAtualId = (typeof jsonPastaAtualId != 'undefined') ? jsonPastaAtualId : null;
				tecDadosGerador.buscarPastasCadernos()
				.then(function(pastasCadernos) {
					vm.pastasCadernos = pastasCadernos;
					vm.pastaCadernosAtual = pastasCadernos[0];
					
					var pastasModoCursoString = localStorage.getItem("tec.pastasModoCurso" + "["+userId+"]");
					var pastasModoCurso = new Set();
					if (pastasModoCursoString) {
						pastasModoCurso = new Set(JSON.parse(pastasModoCursoString));
					}

					if (typeof jsonCaderno != 'undefined') {
						angular.forEach(vm.pastasCadernos, function(pasta) {
							pasta.modoCurso = pastasModoCurso.has(pasta.id);
							if (pasta.id == jsonCaderno.pastaCadernoId) {
								vm.pastaCadernosAtual = pasta;
							}
						});
					} else {
						if(pastaAtualId){
							angular.forEach(vm.pastasCadernos, function(pasta) {
								pasta.modoCurso = pastasModoCurso.has(pasta.id);
								if (pasta.id == pastaAtualId) {
									vm.pastaCadernosAtual = pasta;
								}
						});
						}else{
							angular.forEach(vm.pastasCadernos, function(pasta) {
								pasta.modoCurso = pastasModoCurso.has(pasta.id);
								if (pasta.ativa) {
									vm.pastaCadernosAtual = pasta;
								}
							});
						}
					}
				});
				
				$scope.$watch("vm.filtros", function(mapFiltros) {
					if (mapFiltros) {
						vm.arrayFiltros = tecDadosGeradorFiltros.mapFiltrosParaArray(mapFiltros);
					}
				});
			}

			function ajustarTotalQuestoesSelecionadasMobile() {
				var questoes = !vm.totalQuestoesSelecionadasMobile ? 0 : parseInt(vm.totalQuestoesSelecionadasMobile);

				if (questoes < 1) {
					vm.totalQuestoesSelecionadasMobile = 1;
				} else if (questoes > vm.numeroQuestoesEncontradas) {
					vm.totalQuestoesSelecionadasMobile = vm.numeroQuestoesEncontradas;
				}
			}

			function gerarCaderno() {
				vm.exibirDelay = true;

				$timeout(function () {
					if(!$.isAssinanteLogado() && vm.formato.id === "DISCURSIVA") {
						tec.alert("A criação de cadernos com questões discursivas é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	                	return;
					}

					var qtdValida = vm.numeroQuestoesEncontradas;
					if (vm.configurarCaderno) {
						qtdValida = vm.totalQuestoesSelecionadas;
					} else if (!!vm.totalQuestoesSelecionadasMobile && vm.totalQuestoesSelecionadasMobile !== vm.numeroQuestoesEncontradas) {
						qtdValida = vm.totalQuestoesSelecionadasMobile;
					}

					if (!qtdValida || qtdValida == 0) {
						tec.alert('Não é possível gerar caderno sem questões.', 'Aviso');
						return;
					} else {
						if(!$.isAssinanteLogado()) {
							if (qtdValida > 500) {
								var mensagem = "Cada caderno pode conter até <b>500 questões</b>. Para continuar, ajuste a seleção das questões até que a quantidade fique dentro desse limite.<br/><br/>"
											   +"Quer criar cadernos com até <b>10 mil questões</b>? Assine o plano <a href='" + contextPathUrl + "assinar'>Padrão</a> ou <a href='" + contextPathUrl + "assinar'>Avançado</a>."
								tec.alert(mensagem, "Limite de Questões Excedido");
								vm.exibirDelay = false;
								return;
							}
						} else {
							if (qtdValida > 10000) {
								var mensagem = "Cada caderno pode conter, no máximo, <b>10 mil questões</b>. Para continuar criando seu caderno, ajuste a seleção das questões até que a quantidade fique dentro desse limite.";
								tec.alert(mensagem, "Limite de Questões Excedido");
								vm.exibirDelay = false;
								return;
							}
						}
						gerarCadernoSubmit();
					}

					vm.exibirDelay = false;
				}, 2000);

			}
			
			function gerarCadernoSubmit() {
				vm.salvando = true;
				atualizarListaDeAssuntos();
				$timeout(function(){
					enviar();
				}, 0);
			}
			
			function enviar() {
				if (vm.enviando !== true) {
					vm.enviando = true;
					if (vm.gerarEmSerie) {
						var parameters = $("#geradorForm").serializeToJSON();
						tecDadosGerador.gerarCaderno(parameters)
						.then(function(data) {
							var mensagem = data.mensagem ? data.mensagem : "Erro Inesperado. Recarregue a página e tente novamente.";
							if (mensagem.indexOf("Erro") !== -1) {
								alertify.error(mensagem, 0);
							} else {
							    var quantidadeQuestoes = (vm.totalQuestoesSelecionadas) ? vm.totalQuestoesSelecionadas : vm.numeroQuestoesEncontradas;
							    var quantidadeRestante = vm.numeroQuestoesEncontradas - quantidadeQuestoes;
						    	var pluralQuestao = quantidadeQuestoes > 1 ? ' questões' : ' questão';
							    var mensagemQuestoes = quantidadeQuestoes + pluralQuestao;
							    var mensagemRestantes = '';

							    if (quantidadeRestante == 0) {
							    	mensagemRestantes = 'Não restam mais questões.';
							    } else {
							    	var pluralResta = quantidadeRestante > 1 ? 'Restam' : 'Resta';
							    	pluralQuestao = quantidadeRestante > 1 ? ' questões.' : ' questão.';
							    	mensagemRestantes = pluralResta + ', ainda, <b>' + quantidadeRestante + '</b>' + pluralQuestao;
							    }

							    alertify.message('<a href="' + contextPathUrl + 'questoes/cadernos/' + data.id + '/caderno" target="_blank">' + vm.nomeCaderno + '</a> com ' + mensagemQuestoes + ' salvo na pasta <b>' + vm.pastaCadernosAtual.nome + '</b>.\r\n' + mensagemRestantes, 0);
								vm.numeroQuestoesEncontradas = quantidadeRestante;
							}

							//precisa fechar para recalcular a quantidade de questoes.
							vm.cadernosGerados ++;
							vm.atualizarConfiguracoes = true;

							vm.salvando = false;
						});

					} else {
						//TODO depois dos testes remover o comentario do submit()
						$("#geradorForm").submit();
						/*var parameters = $("#geradorForm").serializeToJSON();
						tecDadosGerador.testeGeracao(parameters)
						.then(function(data) {
							console.log(data);
						});*/
					}
					vm.enviando = false;
				}
			}
			
			function atualizarListaDeAssuntos() {
				vm.listaAssuntos = [];
				angular.forEach(vm.matrizAssuntos, function(assuntos, index) {
					if(assuntos != null && assuntos.length > 0) {
						var materia = assuntos[0];
						atualizarAssuntos(assuntos[0], materia);
					}
				});
			}
			
			function atualizarAssuntos(node, materia) {
				if (node == null)
					return;
				if (node.subTree) {
					angular.forEach(node.subTree, function(assunto, index) {
						if(assunto.contagemAlteracao != 0) {
							var assuntoMateria = assunto;

							if (!assunto.materia || !assunto.materia.id) {
								assuntoMateria["materia"] = materia;
							}

							vm.listaAssuntos.push(assuntoMateria);
						}
					});
				}
				
				angular.forEach(node.subTree, function(assunto, index) {
					atualizarAssuntos(assunto, materia);
				});
			}

			function onGerarEmSerie() {
				if (!$.isAssinanteLogado()) {
					tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
					vm.gerarEmSerie = false;
				}
			}

			function desabilitarGerarEmSerie() {
				if (vm.caderno != null) {
					return true;
				}

				var tipos = Object.keys(vm.filtros);
				if (tipos.length == 1 && tipos[0] == "ENUNCIADO") {
					vm.gerarEmSerie = false;
					return true;
				}

				return false;
				// ng-click="vm.onGerarEmSerie()" ng-disabled="vm.caderno"/> tec-tooltip="{{ vm.caderno === undefined ? 'Marque para gerar cadernos sem repetir questões entre eles.' : 'Opção desativada na edição de caderno' }}" ></span>

			}
		}
	});
});

module.directive("tecGeradorCadernoDeslogado", function(tec) {
	return tec.defaultDirective({
		scope: {
			contexto: "="
		},
		template: tec.multiline(function() {/**
			<div class="gerador-caderno">
				<form id="geradorForm" action="" method="post">
					<div class="gerador-caderno-grid">
						<div class="gerador-caderno-nome">
							<div class="form-group">
								<label>Nome do caderno</label>
								<input type="text" name="nomeCaderno" class="form-control" value="Caderno de Estudo" maxlength="150" tec-bloquear-keydown />
							</div>
						</div>
						<div class="gerador-caderno-pasta">
							<div class="form-group">
								<label>Pasta de destino</label>
								<select class="form-control">
									<option value="0">Sem Classificação</option>
								</select>
							</div>
						</div>
						<div class="gerador-caderno-gerar">
							<div class="form-group">
								<label><input type="checkbox" class="caderno-em-serie" />Gerar <span class="hidden-sm">cadernos </span>em série</label><span class="glyphicon glyphicon-info-sign informacao" tec-tooltip="Marque para permanecer nesta tela e criar cadernos sequenciais sem questões repetidas entre si" ></span>
								<button type="button" ng-click="vm.gerarCaderno()">Gerar Caderno aqui</button>
							</div>
						</div>
					</div>
				</form>
			</div>
		**/}),
		controller: function($scope, tecDadosGerador, tecDadosGeradorFiltros) {
			var vm = this;
			vm.gerarCaderno = gerarCaderno;
			ativar();
			
			function ativar() {
			}
			
			function gerarCaderno() {
				window.location.href = vm.contexto +  "/cadastro";
			}
		}
	});
});




module.directive("tecGeradorConfigurar", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			configurarCaderno: "=",
			materias: "=",
			listaAssuntos: "=",
			matrizAssuntos: "=",
			numeroQuestoesEncontradas: "=",
			totalQuestoesSelecionadas: "=",
			gerarEmSerie: "=",
			cadernosGerados: "=",
			arvoreAssuntos: "=",
			atualizarConfiguracoes: "=",
			formaEscolherQuestoes: "=",
			configurarCadernoDesbloqueada: "=",
			onExibirConfigurarCaderno: "=",
		},
		template: tec.multiline(function() {/**
		<div>
			<div class="gerador-configurar-caderno" >
				<input type="hidden" name="universo" value="{{vm.universo.id}}" />
				<input type="hidden" name="formato" value="{{vm.formato.id}}" />
				
				<div class="gerador-configurar-caderno-opcoes">
					<div>
						<span>Organizar por: </span>
						<span class="menu-voador">
							<button class="trigger nvda-botao-transparente" data-toggle="dropdown" aria-label="menu opções">
								<a role="button" class="indice-complementos-menu-item menu-item-link" aria-label="Ordenado por {{vm.ordenadoPor.descricao}}">{{vm.ordenadoPor.descricao}}</a>
							</button>
							<ul class="dropdown-menu">
								<li><a role="button" ng-class="{ 'negrito': vm.ordenadoPor.tipo == 'HIERARQUIA' }" ng-click='vm.alterarOrdenacao(vm.ordenacao.HIERARQUIA)'>Hierarquia</a></li>
								<li><a role="button" ng-class="{ 'negrito': vm.ordenadoPor.tipo == 'RELEVANCIA' }" ng-click="vm.alterarOrdenacao(vm.ordenacao.RELEVANCIA)">Relevância (com matéria)</a></li>
								<li><a role="button" ng-class="{ 'negrito': vm.ordenadoPor.tipo == 'RELEVANCIA_ASSUNTOS' }" ng-click="vm.alterarOrdenacao(vm.ordenacao.RELEVANCIA_ASSUNTOS)">Relevância (apenas assuntos)</a></li>
							</ul>
						</span>
					</div>

					<div>
						<span>Popular com questões: </span>
						<span class="menu-voador">
							<button class="trigger nvda-botao-transparente" data-toggle="dropdown" aria-label="menu opções">
								<a role="button" class="indice-complementos-menu-item menu-item-link" aria-label="Ordenado por {{vm.popularQuestoes[vm.formaEscolherQuestoes].descricao}}">{{vm.popularQuestoes[vm.formaEscolherQuestoes].descricao}}</a>
							</button>
							<ul class="dropdown-menu">
								<li><a role="button" ng-class="{ 'negrito': vm.formaEscolherQuestoes == 'RECENTES' }" ng-click='vm.alterarFormaDeEscolherQuestoes(vm.popularQuestoes.RECENTES)'>Mais Recentes</a></li>
								<li><a role="button" ng-class="{ 'negrito': vm.formaEscolherQuestoes == 'ALEATORIA' }" ng-click="vm.alterarFormaDeEscolherQuestoes(vm.popularQuestoes.ALEATORIA)">Aleatórias</a></li>
							</ul>
						</span>
					</div>
				</div>

				<div class="gerador-configurar-wrapper-tabela">
					<table class="tabela-configurar-caderno table" id="gerador-arvore-assuntos">
						<thead class="thead">
							<tr class="row cabecalho">
								<th class="col-xs-6" ng-if="vm.ordenadoPor !== vm.ordenacao.RELEVANCIA_ASSUNTOS">Matéria</th>
								<th class="col-xs-6" ng-if="vm.ordenadoPor === vm.ordenacao.RELEVANCIA_ASSUNTOS">Assuntos</th>
								<th class="centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">Questões encontradas</th>
								<th class="coluna-conteudo cabecalho-frequencia-acumulada hidden-xs centro" ng-if="vm.ordenadoPor !== vm.ordenacao.HIERARQUIA">
									<input type="checkbox" ng-model="vm.mostrarFrequenciaAcumulada">Frequência Acumulada
								</th>
								<th class="centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">Questões no caderno</th>
							</tr>
						</thead>

						<tbody class="tbody" ng-repeat="materia in vm.materias track by materia.id">
							<tr class="row" ng-if="vm.ordenadoPor !== vm.ordenacao.RELEVANCIA_ASSUNTOS">
								<td class="col-xs-6" >
									<span>{{materia.nome}}</span>
									<a role="button" class="expandir-materia" ng-click="vm.expandirAssuntos(materia)" ng-if="vm.formato.id != 'DISCURSIVA' && (!vm.arvoreAssuntos[materia.id] || vm.assuntosEscondidos[materia.id])">(Expandir)</a>
									<a role="button" class="expandir-materia" ng-click="vm.recolherAssuntos(materia)" ng-if="vm.formato.id != 'DISCURSIVA' && vm.arvoreAssuntos[materia.id] && !vm.assuntosEscondidos[materia.id]">(Recolher)</a>
								</td>

								<td class="alinamento centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">
									{{materia.numeroQuestoes}} ({{materia.porcentagemEncontrado}}%)
								</td>

								<td class="coluna-conteudo hidden-xs centro" ng-if="vm.ordenadoPor !== vm.ordenacao.HIERARQUIA"></td>

								<td class="alinamento centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">
									<input type="text" name="materias[].numeroQuestoesCaderno" inputmode="numeric" pattern="[0-9]*" maxlength="6" size="4"
										ng-model="materia.numeroQuestoesCaderno" ng-blur="vm.recalcularTotal(materia)"
										style="text-align: center;" tec-bloquear-keydown />

									<span style="margin-left:5px;">({{materia.porcentagemCaderno}}%)</span>
								</td>
							</tr>

							<tr ng-if="vm.arvoreAssuntos[materia.id]" ng-hide="vm.assuntosEscondidos[materia.id]" class="arvore-assuntos-{{materia.id}}">
								<td colspan='5' class="coluna-materia-expandida">
									<tec-gerador-configurar-assuntos
										index="{{$index}}"
										materia="materia"
										lista-assuntos="vm.listaAssuntos"
										matriz-assuntos="vm.matrizAssuntos"
										filtros="vm.filtros"
										universo="vm.universo"
										formato="vm.formato"
										gerar-em-serie="vm.gerarEmSerie"
										total-questoes-selecionadas="vm.totalQuestoesSelecionadas"
										total-questoes-original="vm.totalQuestoesOriginal"
										total-questoes-encontradas="vm.totalEncontradas"
										ordenado-por="vm.ordenadoPor"
										mostrar-frequencia-acumulada="vm.mostrarFrequenciaAcumulada"
										rebuscar-assuntos="vm.rebuscarAssuntos"
										ng-if="vm.arvoreAssuntos[materia.id]" class="indice-hierarquico gerador-indice-hierarquico">
									</tec-gerador-configurar-assuntos>
								</td>
							</tr>
						</tbody>

						<tfoot class="tfoot">
							<tr class="row rodape">
							  <td class="col-xs-6" ng-if="vm.ordenadoPor !== vm.ordenacao.RELEVANCIA_ASSUNTOS">Todas as matérias</td>
							  <td class="col-xs-6" ng-if="vm.ordenadoPor === vm.ordenacao.RELEVANCIA_ASSUNTOS">Todos os assuntos</td>
							  <td class="centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">{{vm.totalEncontradas}}</td>
							  <td class="coluna-conteudo hidden-xs centro" ng-if="vm.ordenadoPor !== vm.ordenacao.HIERARQUIA"></td>
							  <td class="centro" ng-class="{'coluna-conteudo-hierarquia': vm.ordenadoPor === vm.ordenacao.HIERARQUIA, 'coluna-conteudo': vm.ordenadoPor !== vm.ordenacao.HIERARQUIA}">
								<input type="text" name="novoTotal" size='4' inputmode="numeric" pattern="[0-9]*" ng-model="vm.totalQuestoesSelecionadas"
									ng-blur="vm.redistribuirProporcionalmente()" style="text-align: center;" maxlength="6"
									ng-class="{'gerador-configurar-caderno-novo-total': vm.totalQuestoesSelecionadas != vm.totalEncontradas}"
									tec-bloquear-keydown aria-label='Alterar quantidade total de questões do caderno'/>
							  </td>
							</tr>
						</tfoot>
					</table>
				</div>
				
				<div class="gerador-configurar-caderno-footer" >
					<button class="btn btn-tec" ng-click="vm.onExportarExcel()">Exportar para planilha</button>
					<a class="botao-fechar-complemento" ng-click="vm.fecharConfiguracoes()" >
						<span class="glyphicon glyphicon-remove" title=""></span><span>CANCELAR</span>
					</a>
				</div>
			</div>
		</div>
		**/}),
		controller: function($scope, $timeout, tecDadosGerador, tecDadosGeradorFiltros) {
			var vm = this;
			vm.exibirConfiguracoes = exibirConfiguracoes;
			vm.redistribuirProporcionalmente = redistribuirProporcionalmente;
			vm.recalcularTotal = recalcularTotal;
			vm.carregarTabela = carregarTabela;
			vm.fecharConfiguracoes = fecharConfiguracoes;
			vm.expandirAssuntos = expandirAssuntos;
			vm.recolherAssuntos = recolherAssuntos;
			vm.alterarOrdenacao = alterarOrdenacao;
			vm.alterarFormaDeEscolherQuestoes = alterarFormaDeEscolherQuestoes;
			vm.onExportarExcel = onExportarExcel;
			vm.ordenacao = {
				HIERARQUIA: { tipo: 'HIERARQUIA', descricao: "Hierarquia" },
				RELEVANCIA: { tipo: 'RELEVANCIA', descricao: "Relevância (com matéria)" },
				RELEVANCIA_ASSUNTOS: { tipo: 'RELEVANCIA_ASSUNTOS', descricao: "Relevância (apenas assuntos)" },
			};

			vm.popularQuestoes = {
				RECENTES: { tipo: 'RECENTES', descricao: "Mais Recentes" },
				ALEATORIA: { tipo: 'ALEATORIA', descricao: "Aleatórias" },
			};

			vm.ordenadoPor = vm.ordenacao.HIERARQUIA;

			vm.assuntosEscondidos = {};

			vm.mostrarFrequenciaAcumulada = true;

			ativar();
			
			function ativar() {
				$scope.$watch("vm.atualizarConfiguracoes", function(atualizarConfiguracoes) {
					if (!atualizarConfiguracoes) {
						return;
					}

					if (vm.numeroQuestoesEncontradas > 100000) {
						vm.exibirConfiguracoes(false);
						return;
					}

					carregarDadosTabela(vm.filtro, true)
						.then(function() {
							vm.atualizarConfiguracoes = false;
							vm.rebuscarAssuntos = true;
						});
				});

				$scope.$on("RecalcularPorcentagens", function(event, total) { calcularPorcentagensSelecionadas(total); });
			}

			function alterarOrdenacao(ordenacao) {
				vm.ordenadoPor = ordenacao;

				carregarDadosTabela(vm.filtros, false)
			}

			function alterarFormaDeEscolherQuestoes(forma) {
				vm.formaEscolherQuestoes = forma.tipo;

				localStorage.setItem("tec.formaEscolherQuestoes" + "["+userId+"]", forma.tipo);
			}

			function carregarDadosTabela(filtro, manterSelecao) {
				if (vm.ordenadoPor === vm.ordenacao.RELEVANCIA_ASSUNTOS) {
					return tratarMateriaRelevanciaAssuntos(manterSelecao);
				}

				return tecDadosGeradorFiltros.buscarQuestoesPorMaterias(vm.filtros, vm.universo, vm.formato, vm.gerarEmSerie, vm.ordenadoPor.tipo)
					.then(function(materias) {
						angular.forEach(materias, function(materia, index) {
							for (var i = 0; i < vm.materias.length; i++) {
								if (vm.materias[i] && vm.materias[i].id === materia.id) {
									materia.redistribuirFilhos = vm.materias[i].redistribuirFilhos;
									materia.calcularPorcentagemFilhos = vm.materias[i].calcularPorcentagemFilhos;

									var questoesAnteriores = vm.materias[i].numeroQuestoesCaderno;

									if (manterSelecao) {
										materia.numeroQuestoesCaderno = isNaN(questoesAnteriores) ?
											materia.numeroQuestoes : Math.min(questoesAnteriores, materia.numeroQuestoes);
									} else {
										materia.numeroQuestoesCaderno = materia.numeroQuestoes;
                                    }

									vm.materias.splice(i, 1);
									break;
								}
							}

							materia.numeroQuestoesOriginal = isNaN(materia.numeroQuestoesCaderno) ?
								materia.numeroQuestoes : materia.numeroQuestoesCaderno;
						});

						vm.materias = materias;
						vm.carregarTabela(manterSelecao);
						angular.forEach(materias, function(obj, index) {
							vm.matrizAssuntos[index] = [];
						});
                });
			}

			function tratarMateriaRelevanciaAssuntos(manterSelecao) {
				// Precisamos criar uma matéria ficticia por que todo o código espera que a matéria é a raiz dos assuntos.
				var materia = {
					id: 0,
					nome: 'Total assuntos por relevância',
					numeroQuestoes: vm.numeroQuestoesEncontradas,
					numeroQuestoesCaderno: manterSelecao ? Math.min(vm.totalQuestoesSelecionadas, vm.numeroQuestoesEncontradas) : vm.numeroQuestoesEncontradas,
					numeroQuestoesOriginal: vm.numeroQuestoesEncontradas
				}

				if (vm.materias[0].id == 0) {
					materia.redistribuirFilhos = vm.materias[0].redistribuirFilhos;
					materia.calcularPorcentagemFilhos = vm.materias[0].calcularPorcentagemFilhos;
				}

				vm.materias = [materia];
				vm.matrizAssuntos[0] = [];
				vm.carregarTabela(manterSelecao);
				vm.arvoreAssuntos[0] = true;
				vm.assuntosEscondidos[0] = false;
				return Promise.resolve();
			}

			function exibirConfiguracoes(flag) {
				if (vm.configurarCaderno !== flag) {
					if (flag && vm.numeroQuestoesEncontradas > 100000) {
						var mensagem = "A edição de quantidades só pode ser feita quando o filtro retornar, no máximo, <b>100 mil questões</b>. Para continuar, ajuste os filtros até que a quantidade fique dentro desse limite.";
						tec.alert(mensagem, "Limite para Editar Quantidades Excedido");
						return;
					}

					vm.configurarCaderno = flag;
					vm.atualizarConfiguracoes = true;

					if (vm.onExibirConfigurarCaderno) {
						vm.onExibirConfigurarCaderno({ abriu: flag });
					}
				}
			}

			function fecharConfiguracoes() {
				vm.totalQuestoesSelecionadas = null;
				vm.exibirConfiguracoes(false);
				vm.materias = [];
			}

			function redistribuirProporcionalmente() {
				var questoes = !vm.totalQuestoesSelecionadas ? 0 : parseInt(vm.totalQuestoesSelecionadas);

				if (questoes > vm.totalEncontradas) {
					questoes = parseInt(vm.totalEncontradas);
				} else if (questoes < 0) {
					questoes = 0;
				}

				vm.totalQuestoesSelecionadas = questoes;

				if (questoes == vm.totalQuestoesOriginal) {
					return;
				}

				vm.totalQuestoesOriginal = questoes;

				var porcentagemDoTotal = vm.totalQuestoesSelecionadas / vm.totalEncontradas;
				var somaMaterias = 0;

				angular.forEach(vm.materias, function(materia, index) {
					materia.numeroQuestoesOriginal = materia.numeroQuestoesCaderno;
					materia.numeroQuestoesCaderno = Math.floor(materia.numeroQuestoes * porcentagemDoTotal);
					somaMaterias += materia.numeroQuestoesCaderno;
				});

				var diferenca = vm.totalQuestoesSelecionadas - somaMaterias;

				if (diferenca != 0) {
					for (var i = 0; i < diferenca; i++) {
						var valorMaiorDiferenca = Number.NEGATIVE_INFINITY;
						var indiceMaiorDiferenca = -1;

						angular.forEach(vm.materias, function(materia, index) {
							var proporcaoEncontrada = (materia.numeroQuestoes / vm.totalEncontradas);
							var proporcaoCaderno = (materia.numeroQuestoesCaderno / vm.totalQuestoesSelecionadas);

							var diferencaProporcao = proporcaoEncontrada - proporcaoCaderno;

							if (diferenca < 0) {
								diferencaProporcao = -diferencaProporcao;
							}

							if (valorMaiorDiferenca < diferencaProporcao) {
								valorMaiorDiferenca = diferencaProporcao;
								indiceMaiorDiferenca = index;
							}
						});

						vm.materias[indiceMaiorDiferenca].numeroQuestoesCaderno += (diferenca < 0) ? -1 : 1;
					}
				}

				vm.totalCaderno = 0;
				
				angular.forEach(vm.materias, function(materia, index) {
					vm.totalCaderno += materia.numeroQuestoesCaderno;

					if (vm.totalQuestoesSelecionadas == 0) {
						materia.porcentagemCaderno = 0;
					} else {
						materia.porcentagemCaderno = (100 * (materia.numeroQuestoesCaderno / vm.totalQuestoesSelecionadas)).toFixed(2);
					}

					if (vm.arvoreAssuntos[materia.id]) {
						materia.redistribuirFilhos(true, materia.numeroQuestoesOriginal - materia.numeroQuestoesCaderno, vm.totalQuestoesSelecionadas, porcentagemDoTotal);
					}

					materia.numeroQuestoesOriginal = materia.numeroQuestoesCaderno;
				});
			}

			function recalcularTotal(materia) {
				var valor = !materia.numeroQuestoesCaderno ? 0 : parseInt(materia.numeroQuestoesCaderno);

				if (valor > materia.numeroQuestoes) {
					valor = materia.numeroQuestoes;
				} else if (valor < 0) {
					valor = 0;
				}

				materia.numeroQuestoesCaderno = valor;

				if (valor == materia.numeroQuestoesOriginal) {
					return;
				}

				var quantidadeReduzida = materia.numeroQuestoesOriginal - valor;

				materia.numeroQuestoesOriginal = valor;
				
				vm.totalCaderno = 0;
				angular.forEach(vm.materias, function(materia, index) {
					vm.totalCaderno += materia.numeroQuestoesCaderno;
				});

				vm.totalQuestoesSelecionadas = vm.totalCaderno;
				vm.totalQuestoesOriginal = vm.totalCaderno;

				if (vm.arvoreAssuntos[materia.id]) {
					materia.redistribuirFilhos(false, quantidadeReduzida, vm.totalQuestoesSelecionadas);
				}

				calcularPorcentagensSelecionadas(vm.totalQuestoesSelecionadas);
			}

			function calcularPorcentagensSelecionadas(total) {
				angular.forEach(vm.materias, function(materia, index) {

					if (total == 0) {
						materia.porcentagemCaderno = 0;
					} else {
						materia.porcentagemCaderno = (100 * (materia.numeroQuestoesCaderno / total)).toFixed(2);
					}

					if (vm.arvoreAssuntos[materia.id]) {
						materia.calcularPorcentagemFilhos(total);
					}
				});
			}
			
			function carregarTabela(manterSelecao) {
				calcularTotalDeQuestoesEncontrados(manterSelecao);
				
				tecDadosGeradorFiltros.resetListaAssuntos(vm.listaAssuntos);
				tecDadosGeradorFiltros.resetMatrizAssuntos(vm.matrizAssuntos);
			}
			
			function calcularTotalDeQuestoesEncontrados(manterSelecao) {
				vm.totalEncontradas = 0;
				vm.totalSelecionadas = 0;

				angular.forEach(vm.materias, function(materia, index) {
					vm.totalEncontradas += materia.numeroQuestoes;

					if (manterSelecao) {
                       	materia.numeroQuestoesCaderno = isNaN(materia.numeroQuestoesCaderno) ? materia.numeroQuestoes : materia.numeroQuestoesCaderno;
					} else {
						materia.numeroQuestoesCaderno = materia.numeroQuestoes;
					}

					vm.totalSelecionadas += materia.numeroQuestoesCaderno;
				});

				vm.totalCaderno = vm.totalEncontradas;
				vm.totalQuestoesSelecionadas = vm.totalSelecionadas;
				vm.totalQuestoesOriginal = vm.totalSelecionadas;

				angular.forEach(vm.materias, function(materia, index) {
					if (vm.totalEncontradas == 0) {
						materia.porcentagemEncontrado = 0;
						materia.porcentagemCaderno = 0;
					} else {
						materia.porcentagemEncontrado = (100 * (materia.numeroQuestoes / vm.totalEncontradas)).toFixed(2);

						if (materia.numeroQuestoesCaderno != materia.numeroQuestoes) {
							materia.porcentagemCaderno = (100 * (materia.numeroQuestoesCaderno / vm.totalQuestoesSelecionadas)).toFixed(2);
						} else {
							materia.porcentagemCaderno = materia.porcentagemEncontrado;
						}
					}
				});
			}
			
			function expandirAssuntos(materia) {
				vm.arvoreAssuntos[materia.id] = true;
				vm.assuntosEscondidos[materia.id] = false;
			}

			function recolherAssuntos(materia) {
				vm.assuntosEscondidos[materia.id] = true;
			}

			function onExportarExcel() {
				if (!$.isAssinanteLogado()) {
					$.alerts.alert("Esta funcionalidade está disponível para assinantes. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo para usuário Assinante");
					return;
				}

				var dados = montarDadosExcel();

				dados["ordenacao"] = vm.ordenadoPor.tipo;

				tecDadosGeradorFiltros.exportarConfiguracaoExcel(dados)
					.then(function(response) {
						var download = response.download;
						if (download) {
							var a = document.createElement("a");
							a.href = download.url;
							document.body.appendChild(a);
							a.click();
						}
					});
			}

			function montarDadosExcel() {
				var indice = 0;
				var dados = {};

				angular.forEach(vm.materias, function(materia, i) {
					var objeto = materia

					if (vm.matrizAssuntos[i].length > 0) {
						objeto = vm.matrizAssuntos[i][0];
					} else {
						objeto.contagem = materia.numeroQuestoes;
					}

					indice = montarDados(dados, objeto, indice);
				});

				return dados;

				function montarDados(dados, objeto, indice, hierarquiaPai) {
					dados["dados["+indice+"].ordenacao"] = indice;
					dados["dados["+indice+"].hierarquia"] = hierarquiaPai;
					dados["dados["+indice+"].nome"] = objeto.nome;
					dados["dados["+indice+"].contagemCaderno"] = objeto.numeroQuestoesCaderno;
					dados["dados["+indice+"].porcentagemCaderno"] = objeto.porcentagemCaderno + "%";
					dados["dados["+indice+"].contagem"] = objeto.numeroQuestoes;
					dados["dados["+indice+"].porcentagem"] = objeto.porcentagemEncontrado + "%";
					dados["dados["+indice+"].tipo"] = objeto.tipo;

					if (!!objeto.frequenciaAcumulada) {
						dados["dados["+indice+"].frequenciaAcumulada"] = objeto.frequenciaAcumulada + "%";
					}

					var hierarquiaPai = typeof hierarquiaPai === "undefined" ? '' : hierarquiaPai + '.';
                    indice += 1;

                    if(objeto.subTree && objeto.subTree.length > 0) {
						angular.forEach(objeto.subTree, function(filho, index) {
							var hierarquiaNova = hierarquiaPai + ("00" + (index + 1)).slice(-2);
							indice = montarDados(dados, filho, indice, hierarquiaNova);
						});
					}

					return indice;
				}
			}
		}
	});
});

module.directive("tecGeradorConfigurarAssuntos", function(tec) {
	return tec.defaultDirective({
		scope: {
			index: "@",
			filtros: "=",
			materia: "=",
			listaAssuntos: "=",
			matrizAssuntos: "=",
			universo: "=",
			formato: "=",
			gerarEmSerie: "=",
			totalQuestoesSelecionadas: "=",
			totalQuestoesOriginal: "=",
			totalQuestoesEncontradas: "=",
			rebuscarAssuntos: "=",
			ordenadoPor: "=",
			mostrarFrequenciaAcumulada: "=",
		},
		template: tec.multiline(function() {/**
		<div>
			<ul class="indice-conteudo">
				<li ng-repeat="assunto in vm.assuntos" ng-include="'indice-arvore'">
				</li>
			</ul>
			
			<script type="text/ng-template" id="indice-arvore">
				<div class="assunto" ng-if="assunto.tipo != 'Materia'">
					<span class="icone-arvore expandir" ng-click="vm.expandirAssunto(assunto)">
						<span class="glyphicon glyphicon-triangle-right icone-seta" ng-show="assunto.ocultar && vm.temFilhos(assunto)" aria-label='recolhido' ></span>
						<span class="glyphicon glyphicon-triangle-bottom icone-seta" ng-show="!assunto.ocultar && vm.temFilhos(assunto)" aria-label='expandido'></span>
						<span ng-show='!vm.temFilhos(assunto)' class="icone-bola" aria-hidden='true'></span>
					</span>
					<span class="col-xs-8 assunto-nome-container" >
						<span ng-if="assunto.nome.length < 50" class="assunto-nome-conteudo" data-toggle="tooltip" title="{{assunto.nome}}" >{{assunto.nome | limitTo:50 }}</span>
						<span ng-if="assunto.nome.length >= 50" class="assunto-nome-conteudo" data-toggle="tooltip" title="{{assunto.nome}}" >{{assunto.nome | limitTo:50 }}...</span>
					</span>
					<span class="assunto-questoes-conteudo-container" >
						<span class="alinamento centro assunto-questoes-contagem" ng-class="{'assunto-questoes-conteudo-hierarquia': vm.ordenadoPor.tipo === 'HIERARQUIA', 'assunto-questoes-conteudo': vm.ordenadoPor.tipo !== 'HIERARQUIA'}">
							<span ng-if="assunto.contagem == 0" style="color: #fc2d1e">{{assunto.contagem}}</span>
							<span ng-if="assunto.contagem != 0">{{assunto.contagem}} ({{assunto.porcentagemEncontrado}}%)</span>
						</span>

						<span class="alinamento centro hidden-xs assunto-questoes-conteudo assunto-questoes-frequencia-acumulada" ng-if="vm.ordenadoPor.tipo !== 'HIERARQUIA'">
							<span ng-class="{'esconder': !vm.mostrarFrequenciaAcumulada}" class="grafico-frequencia-acumulada" ><span class="barra-preenchida" style="width: {{assunto.frequenciaAcumulada}}%;"></span></span>
							<span ng-class="{'esconder': !vm.mostrarFrequenciaAcumulada}">{{assunto.frequenciaAcumulada}}%</span>
						</span>

						<span class="alinamento centro assunto-questoes-quantidade" ng-class="{'assunto-questoes-conteudo-hierarquia': vm.ordenadoPor.tipo === 'HIERARQUIA', 'assunto-questoes-conteudo': vm.ordenadoPor.tipo !== 'HIERARQUIA'}">
							<input type="text" inputmode="numeric" pattern="[0-9]*"
							ng-disabled="assunto.contagem == 0"
							ng-if="vm.temFilhos(assunto) || assunto.contagem == 0"
							ng-model="assunto.numeroQuestoesCaderno"
							ng-class="{'input-disabled-font-color': assunto.contagem == 0}"
							ng-blur="vm.recalcularTotal(assunto, true, $event)";
							maxlength="6" size="4" style="text-align: center;" />

							<input type="text" inputmode="numeric" pattern="[0-9]*"
							ng-if="!(vm.temFilhos(assunto) || assunto.contagem == 0)"
							name="assuntos[].numeroQuestoesCaderno"
							ng-model="assunto.numeroQuestoesCaderno"
							ng-blur="vm.recalcularTotal(assunto, false, $event)"
							class="assuntos-questoes"
							maxlength="6" size="4" style="text-align: center;"
							tec-bloquear-keydown />
							<input type="hidden" value="{{assunto.id}}" class="id-assunto" />

							<span style="margin-left:5px;">({{assunto.porcentagemCaderno}}%)</span>

							<span ng-if="!(vm.temFilhos(assunto) || assunto.contagem == 0)">{{vm.ativarAssunto(assunto)}}</span>
						</span>
					</span>
				</div>

				<hr class="linha-assuntos" ng-if="assunto.tipo != 'Materia'" />

				<ul ng-hide="assunto.ocultar">
					<li ng-repeat="assunto in assunto.subTree" ng-include="'indice-arvore'"></li>
				</ul>
			</script>
		</div>
		**/}),
		controller: function($scope, $timeout, tecDadosGerador, tecDadosGeradorFiltros) {
			var vm = this;
			vm.expandirAssunto = expandirAssunto;
			vm.temFilhos = temFilhos;
			vm.recalcularTotal = recalcularTotal;
			vm.ativarAssunto = ativarAssunto;
			vm.indiceEmEdicao = false;
			vm.assuntos = [];
			vm.contagem = 0;
			vm.i = 0;
			
			ativar();
			
			function ativar() {
				vm.materia.redistribuirFilhos = redistribuirTudo;
				vm.materia.calcularPorcentagemFilhos = function(total) { calcularPorcentagensSelecionadas(vm.assuntos, total) };

				$scope.$watch("vm.filtros", function(mapFiltros) {
					vm.arrayFiltros = tecDadosGeradorFiltros.mapFiltrosParaArray(mapFiltros);

					buscarDados(false);
				});

				$scope.$watch("vm.rebuscarAssuntos", function(rebuscarAssuntos) {
					if (!rebuscarAssuntos) {
						return;
					}

					buscarDados(true)
						.then(function() {
							vm.rebuscarAssuntos = false;
						});
				});

				$scope.$watch("vm.ordenadoPor", function(novo, antigo) {
					if (novo && antigo && novo !== antigo) {
						buscarDados(true);
					}
				});
			}

			function buscarDados(manterSelecao) {
				if(vm.ordenadoPor.tipo === 'RELEVANCIA_ASSUNTOS') {
					return tecDadosGeradorFiltros.buscarQuestoesPorAssuntosReleavancia(vm.arrayFiltros, vm.universo, vm.formato, vm.gerarEmSerie)
						.then(function(assuntos){
							tratarAssuntosRelevancia(assuntos, manterSelecao);
						});
				}

				return tecDadosGeradorFiltros.buscarQuestoesPorAssuntosMaisMateria(vm.arrayFiltros, vm.universo, vm.formato, vm.gerarEmSerie, vm.materia.id, vm.ordenadoPor.tipo)
					.then(function(assuntos) {
						montarHierarquia(assuntos, vm.materia);
						vm.assuntos = assuntos;
						vm.matrizAssuntos[vm.index] = vm.assuntos;
						tecDadosGeradorFiltros.adicionarAtributosNaHierarquia(vm.assuntos[0], vm.listaAssuntos.slice(0), vm.materia.id, manterSelecao);
						contagemDeQuestoes(manterSelecao);
						atualizarCssLinhaDosAssuntos();

						if(vm.ordenadoPor.tipo !== 'HIERARQUIA') {
							calcularFrequenciaAcumulada();
						}

						var diferenca = vm.materia.numeroQuestoesCaderno - vm.assuntos[0].numeroQuestoesCaderno;
                        vm.materia.numeroQuestoesCaderno = vm.assuntos[0].numeroQuestoesCaderno;
                        vm.materia.numeroQuestoesOriginal = vm.assuntos[0].numeroQuestoesOriginal;
                        vm.totalQuestoesSelecionadas -= diferenca;
                        $scope.$emit("RecalcularPorcentagens", vm.totalQuestoesSelecionadas);
					});
			}

			function tratarAssuntosRelevancia(assuntos, manterSelecao) {
				angular.forEach(assuntos, function(assunto, index) {
					if (assunto.tipo == 'Assunto Sem Classificação') {
						assunto.tipo = 'Assunto';
						assunto.materia = { id: assunto.id };
						assunto.id = null;
					}
				});

				var materia = {
					id: 0,
					nome: 'Total assuntos por relevância',
					tipo: 'Materia',
					contagem: 0,
					subTree: assuntos
				};

				var assuntosComMateria = [materia];

				montarHierarquia(assuntosComMateria, vm.materia);
				vm.assuntos = assuntosComMateria;
				vm.matrizAssuntos[vm.index] = vm.assuntos;
				tecDadosGeradorFiltros.adicionarAtributosNaHierarquia(vm.assuntos[0], vm.listaAssuntos.slice(0), vm.materia.id, manterSelecao);
				contagemDeQuestoes(manterSelecao);
				calcularFrequenciaAcumulada();
				atualizarCssLinhaDosAssuntos();

				vm.materia.numeroQuestoesCaderno = vm.assuntos[0].numeroQuestoesCaderno;
				vm.materia.numeroQuestoesOriginal = vm.assuntos[0].numeroQuestoesOriginal;
				vm.totalQuestoesSelecionadas = vm.assuntos[0].numeroQuestoesCaderno;
				$scope.$emit("RecalcularPorcentagens", vm.totalQuestoesSelecionadas);
			}

			function montarHierarquia(assuntos, pai) {
				angular.forEach(assuntos, function(assunto, index) {
					assunto.pai = pai;
					if (assunto.subTree && assunto.subTree.length > 0) {
						montarHierarquia(assunto.subTree, assunto);
					}
				});
			}
			
			function atualizarCssLinhaDosAssuntos() {
				$timeout(function(){
					$(".linha-assuntos").each(function(index, obj) {
						var value = calculateRem($(obj).position().left);
						$(obj).css("margin-left", value + "rem");
					});
				}, 0);
			}
			
			function calculateRem(value) {
				var i = Math.round(value);
				var x = 0;
				while(i>0) {
					i-=16;
					x++;
				}
				return -x;
			}
			
			function ativarAssunto(assunto) {
				assunto["ativo"] = true;
			}
			
			function expandirAssunto(assunto) {
				assunto.ocultar = !assunto.ocultar;
			}
						
			function temFilhos(assunto) {
				return assunto.subTree && assunto.subTree.length > 0;
			}
			
			function contagemDeQuestoes(manterSelecao) {
				$(vm.assuntos).each(function(index, assunto) {
					contarQuestoes(assunto, manterSelecao);
				});
			}
			
			function contarQuestoes(elemento, manterSelecao) {
				if (elemento.subTree && elemento.subTree.length > 0) {
					elemento.numeroQuestoesCaderno = 0;
					$(elemento.subTree).each(function(index, filho) {
						var contagemQuestoes = contarQuestoes(filho, manterSelecao);
						elemento.contagem += filho.contagem;
						elemento.numeroQuestoes = elemento.contagem;
						elemento.numeroQuestoesCaderno += contagemQuestoes;
						elemento.numeroQuestoesOriginal = elemento.numeroQuestoesCaderno;
					});
				}

				var temQuantidadeCaderno = !isNaN(elemento.numeroQuestoesCaderno);

				if (vm.totalQuestoesEncontradas == 0) {
					elemento.porcentagemEncontrado = 0;
					elemento.porcentagemCaderno = 0;
				} else {
					elemento.porcentagemEncontrado = (100 * (elemento.contagem / vm.totalQuestoesEncontradas)).toFixed(2);

					if (temQuantidadeCaderno && elemento.numeroQuestoesCaderno != elemento.contagem) {
						elemento.porcentagemCaderno = (100 * (elemento.numeroQuestoesCaderno / vm.totalQuestoesSelecionadas)).toFixed(2);
					} else {
						elemento.porcentagemCaderno = elemento.porcentagemEncontrado;
					}
				}

				if (manterSelecao) {
					return !temQuantidadeCaderno ? elemento.contagem : Math.min(elemento.numeroQuestoesCaderno, elemento.contagem);
				} else {
					return elemento.contagem;
				}
			}

			function calcularFrequenciaAcumulada() {
				if (!vm.assuntos[0]) {
					return;
				}

				var totalMateria = vm.assuntos[0].numeroQuestoes;

				var frequencia = 0;

				$(vm.assuntos[0].subTree).each(function(index, assunto) {
					frequencia += 100 * (assunto.contagem / totalMateria);
					assunto.frequenciaAcumulada = frequencia.toFixed(2);
				});
			}
			
			function recalcularTotal(assunto, redistribuir, event) {
				var valor = !assunto.numeroQuestoesCaderno ? 0 : parseInt(assunto.numeroQuestoesCaderno);

				if (valor > assunto.contagem) {
					valor = assunto.contagem;
				} else if (valor < 0) {
					valor = 0;
				}

				assunto.numeroQuestoesCaderno = valor;

				if (valor == assunto.numeroQuestoesOriginal) {
					return;
				}

				var quantidadeReduzida = assunto.numeroQuestoesOriginal - valor;

				vm.totalQuestoesSelecionadas -= quantidadeReduzida;
				vm.totalQuestoesOriginal -= quantidadeReduzida;

				assunto.numeroQuestoesOriginal = valor;

				var pai = assunto.pai;
				while (pai != null) {
					pai.numeroQuestoesCaderno -= quantidadeReduzida;
					pai.numeroQuestoesOriginal -= quantidadeReduzida;
					pai = pai.pai;
				}

				if (redistribuir) {
					redistribuirFilhos(assunto)
				}

				$scope.$emit("RecalcularPorcentagens", vm.totalQuestoesSelecionadas);
			}

			function redistribuirFilhos(assunto) {
				if (assunto.numeroQuestoesCaderno == assunto.contagem) {
					angular.forEach(assunto.subTree, function(filho, index) {
						filho.numeroQuestoesCaderno = filho.contagem;
						filho.numeroQuestoesOriginal = filho.contagem;
						redistribuirFilhos(filho);
					});
					return;
				}

				var quantidadeFilhos = assunto.subTree.length;
				var quantidadePorAssunto = Math.floor(assunto.numeroQuestoesCaderno / quantidadeFilhos);
				var quantidadeFaltando = assunto.numeroQuestoesCaderno % quantidadeFilhos;

				var assuntosComFilhos = [];
				var assuntosComEspaco = [];

				angular.forEach(assunto.subTree, function(filho, index) {
					if (filho.contagem < quantidadePorAssunto) {
						quantidadeFaltando += quantidadePorAssunto - filho.contagem;
						filho.numeroQuestoesCaderno = filho.contagem;
						filho.numeroQuestoesOriginal = filho.contagem;
					} else {
						filho.numeroQuestoesCaderno = quantidadePorAssunto;
						filho.numeroQuestoesOriginal = quantidadePorAssunto;

						assuntosComEspaco.push(filho);
					}

					if (filho.subTree && filho.subTree.length > 0) {
						assuntosComFilhos.push(filho);
					}
				});

				while (quantidadeFaltando > 0) {
					if (assuntosComEspaco.length == 0) {
						return quantidadeFaltando;
					} else if (assuntosComEspaco.length == 1) {
						assuntosComEspaco[0].numeroQuestoesCaderno += quantidadeFaltando;
						assuntosComEspaco[0].numeroQuestoesOriginal += quantidadeFaltando;
						break;
					}

					for (var i = 0; i < assuntosComEspaco.length; i++) {
						var filho = assuntosComEspaco[i];

						if (filho.numeroQuestoesCaderno == filho.contagem) {
							assuntosComEspaco.splice(i, 1);
							continue;
						}

						filho.numeroQuestoesCaderno += 1;
						filho.numeroQuestoesOriginal += 1;
						quantidadeFaltando -= 1;

						if (quantidadeFaltando == 0) {
							break;
						}
					}
				}

				var quantidadeSobrando = 0;
				angular.forEach(assuntosComFilhos, function(filho, index) {
					quantidadeSobrando += redistribuirFilhos(filho);
				});
			}

			function redistribuirTudoProporcionalmente(assunto, proporcao) {
				if (assunto.numeroQuestoesCaderno == assunto.contagem) {
					angular.forEach(assunto.subTree, function(filho, index) {
						filho.numeroQuestoesCaderno = filho.contagem;
						filho.numeroQuestoesOriginal = filho.contagem;
						redistribuirTudoProporcionalmente(filho, proporcao);
					});
					return;
				}

				angular.forEach(assunto.subTree, function(filho, index) {
					filho.numeroQuestoesOriginal = assunto.numeroQuestoesCaderno;
					filho.numeroQuestoesCaderno = Math.floor(filho.contagem * proporcao);

					if (filho.subTree && filho.subTree.length > 0) {
						redistribuirTudoProporcionalmente(filho, proporcao);
					}
				});
			}

			function checarProporcaoFilhosDistribudos(assunto) {
				var somaFilhos = 0;

				angular.forEach(assunto.subTree, function(filho, index) {
					somaFilhos += filho.numeroQuestoesCaderno;
				});

				var diferenca = assunto.numeroQuestoesCaderno - somaFilhos;

				if (diferenca != 0) {
					for (var i = 0; i < diferenca; i++) {
						var valorMaiorDiferenca = Number.NEGATIVE_INFINITY;
						var indiceMaiorDiferenca = -1;

						angular.forEach(assunto.subTree, function(filho, index) {
							var proporcaoEncontrada = (filho.contagem / vm.totalQuestoesEncontradas);
							var proporcaoCaderno = (filho.numeroQuestoesCaderno / vm.totalQuestoesSelecionadas);

							var diferencaProporcao = proporcaoEncontrada - proporcaoCaderno;

							if (diferenca < 0) {
								diferencaProporcao = -diferencaProporcao;
							}

							if (valorMaiorDiferenca < diferencaProporcao) {
								valorMaiorDiferenca = diferencaProporcao;
								indiceMaiorDiferenca = index;
							}
						});

						assunto.subTree[indiceMaiorDiferenca].numeroQuestoesCaderno += (diferenca < 0) ? -1 : 1;
					}
				}

				angular.forEach(assunto.subTree, function(filho, index) {
					filho.numeroQuestoesOriginal = filho.numeroQuestoesCaderno;

					if (filho.subTree && filho.subTree.length > 0) {
						checarProporcaoFilhosDistribudos(filho);
					}
				});
			}

			function redistribuirTudo(proporcional, quantidadeReduzida, total, proporcao) {
				var materia = vm.assuntos[0];

				materia.numeroQuestoesCaderno -= quantidadeReduzida;
				vm.totalQuestoesSelecionadas = total;

				if (proporcional) {
					redistribuirTudoProporcionalmente(materia, proporcao);
					checarProporcaoFilhosDistribudos(materia);
				} else {
					redistribuirFilhos(materia);
				}

				calcularPorcentagensSelecionadas(vm.assuntos, total);
			}

			function calcularPorcentagensSelecionadas(assuntos, total) {
				angular.forEach(assuntos, function(assunto, index) {
					if (total == 0) {
						assunto.porcentagemCaderno = 0;
					} else {
						assunto.porcentagemCaderno = (100 * (assunto.numeroQuestoesCaderno / total)).toFixed(2);
					}

					if (assunto.subTree && assunto.subTree.length > 0) {
						calcularPorcentagensSelecionadas(assunto.subTree, total);
					}
				});
			}
		}
	});

}); 

module.service("tecDadosGerador", function(tec, tecArvoreFunctions) {
	var service = {
		cache: {},
		buscarUniversos: buscarUniversos,
		buscarGruposFiltro: buscarGruposFiltro,
		buscarFormatosQuestao: buscarFormatosQuestao,
		buscarPastasCadernos: buscarPastasCadernos,
		gerarCaderno: gerarCaderno,
		getFormatoQuestao: getFormatoQuestao,
		mapFormatosQuestoes: []
	};
	
	return service;

	function buscarUniversos() {
		return tec.apiGet("/enums/universos")
		.then(function(data) {
			return data.universos;
		});
	}
	
	function buscarFormatosQuestao() {
		return tec.apiGet("/enums/formatos-questoes")
		.then(function(data) {
			angular.forEach(data.formatos, function(formato) {
				service.mapFormatosQuestoes[formato.id] = formato;
			});
			return data.formatos;
		});
	}
	
	function buscarGruposFiltro(universo) {
		return tec.apiGet("/enums/grupos-filtro", { universo: universo.id })
		.then(function(data) {
			return data.gruposFiltro;
		});
	}
	
	function buscarPastasCadernos() {
		return tec.apiGet("/pastas-cadernos")
		.then(function(data) {
			var pastas = data.pastas;
			return pastas;
		});
	}
	
	function gerarCaderno(parametros) {
		return tec.apiPost("/cadernos/gerar-caderno", parametros)
		.then(function(data) {
			return data;
		});
	}

	function getFormatoQuestao(formatoQuestaoString) {
		return service.mapFormatosQuestoes[formatoQuestaoString];
	}
	
});

module.service("tecDadosGeradorFiltros", function($q, $timeout, tec, tecDadosBuscadores) {
	var service = {
		copiarFiltros: copiarFiltros,
		adicionarFiltro: adicionarFiltro,
		removerFiltro: removerFiltro,
		contarQuestoes: contarQuestoes,
		calcularDificuldade: calcularDificuldade,
		mapFiltrosParaArray: mapFiltrosParaArray,
		buscarQuestoesPorMaterias: buscarQuestoesPorMaterias,
		limparFiltros: limparFiltros,
		buscarQuestoesPorAssuntosMaisMateria: buscarQuestoesPorAssuntosMaisMateria,
		buscarQuestoesPorAssuntosReleavancia: buscarQuestoesPorAssuntosReleavancia,
		resetListaAssuntos: resetListaAssuntos,
		resetMatrizAssuntos: resetMatrizAssuntos,
		zerarMatrizAssuntos: zerarMatrizAssuntos,
		zerarAssuntos: zerarAssuntos,
		listarAssuntosPorMateria: listarAssuntosPorMateria,
		atualizarListaAssuntosComArrayAssuntos: atualizarListaAssuntosComArrayAssuntos,
		adicionarAtributosNaHierarquia: adicionarAtributosNaHierarquia,
		contarQuestoesNosAssuntosDaHierarquia: contarQuestoesNosAssuntosDaHierarquia,
		contagemDeQuestoesParaAlteracao: contagemDeQuestoesParaAlteracao,
		resetContagemAlteracaoComExcecao: resetContagemAlteracaoComExcecao,
		exportarConfiguracaoExcel: exportarConfiguracaoExcel,
		salvarFiltros: salvarFiltros,
		buscarFiltrosSalvos: buscarFiltrosSalvos,
		buscarDadosFiltroSalvo: buscarDadosFiltroSalvo,
		alterarFiltroSalvo: alterarFiltroSalvo,
		excluirFiltroSalvo: excluirFiltroSalvo,
		somenteFiltrosVisiveis: somenteFiltrosVisiveis,
		getFiltroAdaptadasIneditas: getFiltroAdaptadasIneditas,
		contadorQuestoes: null,
		assunto: null
	};

	return service;
	
	function adicionarAtributosNaHierarquia(node, assuntos, idMateria, manterSelecao) {
		if (node == null || !node.subTree) {
			return;
		}

		angular.forEach(node.subTree, function(assunto, index) {
			var contagemAssuntoConfigurado = assunto.contagem;
			for (var i = 0; i < assuntos.length; i++) {
				if ( (!isNaN(assuntos[i].id) && assuntos[i].id === assunto.id) ||
					(isNaN(assuntos[i].id) && assuntos[i].materia.id === idMateria) ||
					(isNaN(assuntos[i].id) && assuntos[i].materia.id === assunto.materia.id)) {

					contagemAssuntoConfigurado = !manterSelecao ? assunto.contagem : Math.min(assuntos[i].numeroQuestoesOriginal, assunto.contagem);
					assuntos.splice(i, 1);
					break;
				}
			}

			assunto["numeroQuestoesOriginal"] = contagemAssuntoConfigurado;
			assunto["numeroQuestoesParaAlteracao"] = assunto.contagem;
			assunto["numeroQuestoesCaderno"] = contagemAssuntoConfigurado;
			assunto["numeroQuestoes"] = assunto.contagem;
			assunto["contagemAlteracao"] = assunto.contagem;
		});
		
		angular.forEach(node.subTree, function(assunto, index) {
			adicionarAtributosNaHierarquia(assunto, assuntos, idMateria, manterSelecao);
		});
	}
	
	function contarQuestoesNosAssuntosDaHierarquia(node) {
		service.contadorQuestoes = 0;
		contarAssuntosNaHierarquia(node);
		return service.contadorQuestoes;
	}
	
	function contarAssuntosNaHierarquia(node) {
		if (node == null)
			return;
		if (node.subTree) {
			angular.forEach(node.subTree, function(assunto, index) {
				service.contadorQuestoes += assunto.numeroQuestoesCaderno;
			});
		}
		
		angular.forEach(node.subTree, function(assunto, index) {
			contarAssuntosNaHierarquia(assunto);
		});
	}
	
	function resetContagemAlteracaoComExcecao(node) {
		if (node == null)
			return;
		if (node.subTree) {
			angular.forEach(node.subTree, function(assunto, index) {
				assunto.numeroQuestoesCaderno = assunto.numeroQuestoesOriginal;
			});
		}
		
		angular.forEach(node.subTree, function(assunto, index) {
			resetContagemAlteracaoComExcecao(assunto);
		});
	}
	
	function contagemDeQuestoesParaAlteracao(assuntos) {
		$(assuntos).each(function(index, assunto) {
			contagemQuestoesAlteracao(assunto);
		});
	}
	
	function contagemQuestoesAlteracao(elemento) {
		if (elemento.subTree && elemento.subTree.length > 0) {
			$(elemento.subTree).each(function(index, filho) {
				var contagemQuestoes = contagemQuestoesAlteracao(filho);
				elemento.numeroQuestoesCaderno += contagemQuestoes;
			});
		}
		return elemento.numeroQuestoesCaderno;
	}
	
	function atualizarListaAssuntosComArrayAssuntos(listaAssuntos, assuntos) {
		angular.forEach(listaAssuntos, function(a1) {
			angular.forEach(assuntos, function(a2) {
				if(a1.id == a2.id) {
					a1.numeroQuestoesCaderno = a2.numeroQuestoesCaderno
				}
			});
		});
	}
	
	
	function resetListaAssuntos(listaAssuntos) {
		angular.forEach(listaAssuntos, function(assunto) {
			assunto.numeroQuestoesCaderno = assunto.numeroQuestoes
		});
	}
	
	function resetMatrizAssuntos(matrizAssuntos) {
		angular.forEach(matrizAssuntos, function(assuntos) {
			resetAssuntos(assuntos[0]);
		});
	}
	
	function resetAssuntos(node) {
		if (node == null)
			return;
		if (node.subTree) {
			angular.forEach(node.subTree, function(assunto, index) {
				assunto.numeroQuestoesCaderno = assunto.numeroQuestoes;
			});
		}
		
		angular.forEach(node.subTree, function(assunto, index) {
			resetAssuntos(assunto);
		});
	}
	
	function zerarMatrizAssuntos(matrizAssuntos) {
		angular.forEach(matrizAssuntos, function(assuntos) {
			zerarAssuntos(assuntos[0]);
		});
	}
	
	function zerarAssuntos(node) {
		if (node == null)
			return;
		if (node.subTree) {
			angular.forEach(node.subTree, function(assunto, index) {
				assunto.numeroQuestoesCaderno = 0;
			});
		}
		
		angular.forEach(node.subTree, function(assunto, index) {
			zerarAssuntos(assunto);
		});
	}
	
	function listarAssuntosPorMateria(listaAssuntos, matrizAssuntos, idMateria) {
		var assuntos = [];
		var matriz = buscarAssuntosNaMatrizDeAssuntosPorMateria(matrizAssuntos, idMateria);
		angular.forEach(listaAssuntos, function(assunto, index) {
			if(assunto.idMateria == idMateria) {
				buscarAssunto(matriz[0], assunto.id);
				assuntos.push(service.assunto);
			}
		});
		
		return assuntos;
	}
	
	function buscarAssuntosNaMatrizDeAssuntosPorMateria(matrizAssuntos, idMateria) {
		var m = null;
		angular.forEach(matrizAssuntos, function(matriz, index) {
			if(matriz.length > 0 && matriz[0].id == idMateria) {
				m = matriz;
			}
		});
		return m;
	}
	
	function buscarAssunto(node, idAssunto) {
		if (node == null)
			return;
		if (node.subTree) {
			angular.forEach(node.subTree, function(assunto, index) {
				if(assunto.id == idAssunto) {
					service.assunto = assunto;
				}
			});
		}
		
		angular.forEach(node.subTree, function(assunto, index) {
			buscarAssunto(assunto, idAssunto);
		});
	}
	
	function copiarFiltros(mapFiltros) {
		//aqui não funcionou angular.copy porque no deep copy ele perdia a referência aos subTrees que estavam
		//renderizados em outras abas, então a cópia teve que ser feita manualmente mesmo
		var copia = {};
		for (var tipo in mapFiltros) {
			copia[tipo] = {};
			for (var filtroId in mapFiltros[tipo]) {
				var filtro = mapFiltros[tipo][filtroId];
				copia[tipo][filtro.id] = filtro;
			}
		}
		return copia;
	}
	
	function adicionarFiltro(mapFiltros, filtro, cadernoBase) {
		var subTree = filtro.subTree || filtro.subTreeOriginal;
		if (filtro.tipo != 'CARGO' && filtro.tipo != 'AREA_CARGO' && filtro.tipo != 'ESPECIALIDADE') {
			removerDescendentes(mapFiltros, subTree);
			aplicarEmDescendentes(subTree, function(descendente) {
				if (!descendente.temFilhos) {
					descendente.bloqueado = true;
				}
			});
		}

		var filtros = porTipo(mapFiltros, filtro.tipo)
		filtros[filtro.id] = filtro;
		filtro.ultimaSelecao = new Date().getTime();
		
		if (!cadernoBase && (filtro.tipo == 'AREA_CARGO' || filtro.tipo == 'ESPECIALIDADE')) {
			var pai = filtro.pai;
			service.adicionarFiltro(mapFiltros, pai);
		}
	}
	
	function removerFiltro(mapFiltros, filtro, universoId) {
		var subTree = filtro.subTree || filtro.subTreeOriginal;
		aplicarEmDescendentes(subTree, function(descendente) {
			if (!descendente.temFilhos) {
				delete descendente.bloqueado;
			}
		});
		
		var filtros = porTipo(mapFiltros, filtro.tipo)
		delete filtros[filtro.id];
		if (!Object.keys(filtros).length) {
			delete mapFiltros[filtro.tipo];
		}
		
		if (universoId != 'PASTAS') {
			validarFiltros(mapFiltros);
		}
	}

	function limparFiltros(mapFiltros) {
		var tiposArvore = ['MATERIA', 'ASSUNTO', 'ORGAO', 'CARGO', 'AREA_CARGO', 'ESFERA'];
		angular.forEach(tiposArvore, function(tipo) {
			angular.forEach(mapFiltros[tipo], function(filtro) {
				if (filtro) {
					var subTree = filtro.subTree || filtro.subTreeOriginal;
					aplicarEmDescendentes(subTree, function(descendente) {
						delete descendente.bloqueado;
					});
				}
			});
		});
		return {};
	}
	
	function contarQuestoes(universo, formato, mapFiltros, gerarEmSerie, caderno, cancelarPromise) {
		// Não permite gerar em série só com filtro enunciado
		if (gerarEmSerie && Object.keys(mapFiltros).length == 1 && mapFiltros.hasOwnProperty('ENUNCIADO')) {
			return Promise.resolve(0);
		}

		var params = { universo: universo.id, formato: formato.id, gerarEmSerie: gerarEmSerie, caderno: caderno }
		var arrayFiltros = mapFiltrosParaArray(mapFiltros);

		if (arrayFiltros.length) {
			angular.forEach(arrayFiltros, function(filtro, index) {
				params["filtros[" + index + "].tipo"] = filtro.tipo;
				params["filtros[" + index + "].id"] = filtro.id;
			});
		}

		// cancelarPromise: ao ser resolvida, aborta esta contagem (evita queries
		// intermediárias inúteis quando o usuário adiciona vários filtros seguidos).
		var config = cancelarPromise ? { timeout: cancelarPromise } : undefined;

		return tec.apiPost("/questoes/contagem/filtros", params, config)
		.then(function(data) {
			if (data.erro) {
				tec.alert(data.erro.mensagem, 'Erro ao contar questões');
				return 0;
			}

			return data.int;
		})
	}

	function calcularDificuldade(universo, formato, mapFiltros, gerarEmSerie) {
		// Não permite gerar em série só com filtro enunciado
		if (gerarEmSerie && Object.keys(mapFiltros).length == 1 && mapFiltros.hasOwnProperty('ENUNCIADO')) {
			return Promise.resolve(0);
		}

		var params = { universo: universo.id, formato: formato.id, gerarEmSerie: gerarEmSerie }
		var arrayFiltros = mapFiltrosParaArray(mapFiltros);

		if (arrayFiltros.length) {
			angular.forEach(arrayFiltros, function(filtro, index) {
				params["filtros[" + index + "].tipo"] = filtro.tipo;
				params["filtros[" + index + "].id"] = filtro.id;
			});
		}

		return tec.apiPost("/cadernos/dificuldade-gerador", params)
		.then(function(data) {
			if (data.erro || data.double < 0) {
				tec.alert(data.erro.mensagem, 'Erro ao calcular dificuldade');
				return -1;
			}

			return data.double;
		})
	}
	
	function mapFiltrosParaArray(mapFiltros) {
		var array = [];
		for (var tipo in mapFiltros) {
			for (var filtroId in mapFiltros[tipo]) {
				var filtro = mapFiltros[tipo][filtroId];
				array.push(filtro);
			}
		}
		array.sort(function(a, b) {
			return a.ultimaSelecao - b.ultimaSelecao;
		});
		return array;
	}

	function somenteFiltrosVisiveis(mapFiltros){
		var arrayFiltros = mapFiltrosParaArray(mapFiltros);
		arrayFiltros = arrayFiltros.filter(function(filtro) {
			return filtro.hide !== true
		})
		return arrayFiltros;
	}

	function getFiltroAdaptadasIneditas(){
		var filtros = ['opcoes'];
		tecDadosBuscadores.forcarRecarregar(filtros)
		return tecDadosBuscadores.carregamentoCompleto()
			.then(function(){
				var filtroAdaptadasIneditas = null;
				angular.forEach(tecDadosBuscadores.filtrosQuestao, function(filtro) {
					if (filtro.id == "SOMENTE_ADAPTADAS_INEDITAS") {
						filtroAdaptadasIneditas = filtro;
					}
				});
				return filtroAdaptadasIneditas;	
			})
	}

	function exportarConfiguracaoExcel(dados) {
		return tec.apiPost("/cadernos/configuracao-gerador/download", dados);
	}

	function buscarQuestoesPorMaterias(mapFiltros, universo, formato, gerarEmSerie, ordenacao) {
		// Não permite gerar em série só com filtro enunciado
		if (gerarEmSerie && Object.keys(mapFiltros).length == 1 && mapFiltros.hasOwnProperty('ENUNCIADO')) {
			return Promise.resolve([]);
		}

		var params = { universo: universo.id, formato: formato.id, gerarEmSerie: gerarEmSerie, ordenacao: ordenacao }
		var arrayFiltros = mapFiltrosParaArray(mapFiltros);
		if (arrayFiltros.length) {
			angular.forEach(arrayFiltros, function(filtro, index) {
				params["filtros[" + index + "].tipo"] = filtro.tipo;
				params["filtros[" + index + "].id"] = filtro.id;
			});
		}

       return tec.apiPost("/materias/buscar-questoes-por-materia", params)
       .then(function(data) {
			return data.list;
		});
	}
	
	function buscarQuestoesPorAssuntosMaisMateria(mapFiltros, universo, formato, gerarEmSerie, materiaId, ordenacao) {
		// Não permite gerar em série só com filtro enunciado
		if (gerarEmSerie && Object.keys(mapFiltros).length == 1 && mapFiltros.hasOwnProperty('ENUNCIADO')) {
			return Promise.resolve([]);
		}

		var params = { universo: universo.id, formato: formato.id, gerarEmSerie: gerarEmSerie, "materia.id": materiaId, ordenacao: ordenacao };
		if (mapFiltros.length || universo.id == 'PASTAS') {
			angular.forEach(mapFiltros, function(filtro, index) {
				params["filtros[" + index + "].tipo"] = filtro.tipo;
				params["filtros[" + index + "].id"] = filtro.id;
			});
			
			return tec.apiPost("/assuntos/buscar-questoes-por-asssunto-mais-materia", params)
			.then(function(data) {
				return data.list;
			});
			
		} else {
			return [];
		}
	}

	function buscarQuestoesPorAssuntosReleavancia(mapFiltros, universo, formato, gerarEmSerie) {
		// Não permite gerar em série só com filtro enunciado
		if (gerarEmSerie && Object.keys(mapFiltros).length == 1 && mapFiltros.hasOwnProperty('ENUNCIADO')) {
			return Promise.resolve([]);
		}

		var params = { universo: universo.id, formato: formato.id, gerarEmSerie: gerarEmSerie };
		if (mapFiltros.length || universo.id == 'PASTAS') {
			angular.forEach(mapFiltros, function(filtro, index) {
				params["filtros[" + index + "].tipo"] = filtro.tipo;
				params["filtros[" + index + "].id"] = filtro.id;
			});

			return tec.apiPost("/assuntos/buscar-questoes-por-asssunto-relevancia", params)
			.then(function(data) {
				return data.list;
			});

		} else {
			return Promise.resolve([]);
		}
	}
	
	//private functions
	function porTipo(mapFiltros, tipo) {
		mapFiltros[tipo] = mapFiltros[tipo] || {};
		return mapFiltros[tipo];
	}
	
	function aplicarEmDescendentes(filtros, callback) {
		angular.forEach(filtros, function(filtro) {
			callback(filtro);
			if (filtro.subTree) {
				aplicarEmDescendentes(filtro.subTree, callback);
			}
		});
	}
	
	function removerDescendentes(mapFiltros, filhos) {
		if (!filhos) {
			return;
		}
		
		var remover = [];
		
		angular.forEach(filhos, function(filho) {
			var filtrosPorTipo = mapFiltros[filho.tipo];
			if (filtrosPorTipo) {
				angular.forEach(filtrosPorTipo, function(filtro) {
					if (filtro.tipo === filho.tipo && filtro.id === filho.id) {
						remover.push(filho);
					}
				});
			}
			
			if (filho.subTree) {
				removerDescendentes(mapFiltros, filho.subTree);
			}
		});

		angular.forEach(remover, function(filtro) {
			removerFiltro(mapFiltros, filtro);
		});
	}
	
	function validarFiltros(mapFiltros) {
		var tipoFiltroQuestoes = "FILTRO_QUESTAO";
		var tipoFiltroSomenteAdaptadasIneditas = "SOMENTE_ADAPTADAS_INEDITAS";
		var filtroSomenteAdaptadasIneditas = (mapFiltros[tipoFiltroQuestoes] && mapFiltros[tipoFiltroQuestoes][tipoFiltroSomenteAdaptadasIneditas]) ? 
			mapFiltros[tipoFiltroQuestoes][tipoFiltroSomenteAdaptadasIneditas] : null;
		if (Object.keys(mapFiltros).length == 1 && mapFiltros[tipoFiltroQuestoes] != null) {
			if(filtroSomenteAdaptadasIneditas) {
				mapFiltros[tipoFiltroQuestoes] = [];
				mapFiltros[tipoFiltroQuestoes][tipoFiltroSomenteAdaptadasIneditas] = filtroSomenteAdaptadasIneditas;
			} else {
				delete mapFiltros[tipoFiltroQuestoes];
			}
		}
	}

	function salvarFiltros(nome, universo, formato, filtros) {
		var body = {
			"filtro.nome": nome,
			"filtro.universo": universo.id,
			"filtro.formato": formato.id,
		};
		angular.forEach(filtros, function (item, index) {
			body["filtro.filtros[" + index + "].id"] = item.id;
			body["filtro.filtros[" + index + "].tipo"] = item.tipo;
		});

		return tec.apiPost("/usuario/filtros", body);
	}

	function buscarFiltrosSalvos(universo, formato) {
		var params = {
			"universo": universo.id,
			"formato": formato.id,
		};

		return tec.apiGet("/usuario/filtros", params)
			.then(function (retorno){
				return retorno.filtros;
			});
	}

	function buscarDadosFiltroSalvo(filtro) {
		return tec.apiGet("/usuario/filtros/" + filtro.id)
			.then(function (retorno){
				return retorno.filtro;
			});
	}

	function alterarFiltroSalvo(filtro) {
		var body = { "filtro.nome": filtro.nome };

		return tec.apiPut("/usuario/filtros/" + filtro.id, body);
	}

	function excluirFiltroSalvo(filtro) {
		return tec.apiDelete("/usuario/filtros/" + filtro.id);
	}
});

})();
