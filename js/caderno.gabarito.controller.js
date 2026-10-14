(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("TecCadernoGabaritoController", TecCadernoGabaritoController);

	TecCadernoGabaritoController.$inject = ["$scope", "$timeout", "tec", "tecDadosCaderno"];

	function TecCadernoGabaritoController($scope, $timeout, tec, factory) {
		var vm = this;

		vm.indices = {
			MATERIA: "Matéria",
			CONCURSO: "Concurso",
			BANCA: "Banca",
			RELEVANCIA: "Relevância"
		};

		vm.exibicao = {
			TODAS: { codigo: "TODAS", valor: "Todas" },
			NAO_RESOLVIDAS: { codigo: "NAO_RESOLVIDAS", valor: "Não resolvidas" },
			RESOLVIDAS: { codigo: "RESOLVIDAS", valor: "Resolvidas" },
			ACERTOS: { codigo: "ACERTOS", valor: "As que acertei" },
			ERROS: { codigo: "ERROS", valor: "As que errei" },
		};

		vm.indiceUsado = vm.indices.MATERIA;
		vm.exibicaoAtual = vm.exibicao.TODAS;
		vm.irPara = null;
		vm.busca = null;

		vm.gabarito = [];
		vm.total = 0;
		vm.pagina = 1;

		vm.fezModificacoes = false;
		vm.offset = 0;

		vm.exibicaoAlterada = exibicaoAlterada;
		vm.irParaQuestao = irParaQuestao;
		vm.buscar = buscar;

		vm.abrirQuestao = abrirQuestao;
		vm.alternativaAlterada = alternativaAlterada;
		vm.carregarMais = carregarMais;

		vm.resolverMarcadas = resolverMarcadas;

		inicializar();

		function inicializar() {
			vm.indiceUsado = vm.indices[vm.caderno.indiceSalvo];
			vm.total = vm.caderno.numeroTotalQuestoes;

			setupAvisoAlteracoes();

			buscarDados(true);
		}

		function exibicaoAlterada(exibicaoNova) {
			vm.exibicaoAtual = exibicaoNova;

			buscarDados(true);
		}

		function irParaQuestao() {
			var questao = $("#questao-" + vm.irPara);

			if (questao.length > 0) {
				focarLinhaQuestao(questao);
			} else {
				vm.offset = vm.irPara;
				buscarDados(true);
			}
		}

		function buscar() {
			if (vm.busca.startsWith("#")) {
				var questao = $("#questao-" + vm.busca.substring(1));

				if (questao.length > 0) {
					focarLinhaQuestao(questao.parent());
					return;
				}
			}
			vm.offset = 0;
			buscarDados(true);
		}

		function focarLinhaQuestao(elemento) {
			elemento.scrollToElement({ skipAnimation: true });

			elemento.addClass("focar-questao");

			$timeout(function() {
				elemento.removeClass("focar-questao");
			}, 2000);
		}

		function abrirQuestao(questao) {
			tratarAlteracoes(function() {
				factory.alterarQuestaoAtual(vm.caderno.idCaderno, questao.posicaoCaderno)
						.then(function() {
							vm.onAbrirQuestao(questao.posicaoCaderno);
						});
			});
		}

		function alternativaAlterada() {
			vm.fezModificacoes = true;
		}

		function carregarMais() {
			buscarDados(false);
		}

		function exibirAlertaInvestidaCompleta() {
			var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida") === "true";
			if(mostrar) {
				confetti({
				  particleCount: 100,
				  spread: 70,
				  origin: { y: 0.6 }
				});
			}

			Toastify({
			  text: "🎉 Parabéns, você completou a investida de hoje!",
			  duration: 3500,
			  gravity: "top", // `top` or `bottom`
			  position: "right", // `left`, `center` or `right`
			  stopOnFocus: true, // Prevents dismissing of toast on hover
			  className: "info"
			}).showToast();
		}

		function resolverMarcadas() {
			var marcadas = [];

			angular.forEach(vm.gabarito, function(questao) {
				if (!!questao.alternativa && !questao.anulada && (questao.acertou === undefined || questao.acertou === null)) {
					marcadas.push(questao);
				}
			});

			if (marcadas.length == 0) {
				return Promise.resolve();
			} else {
				return factory.resolverQuestoesGabarito(vm.caderno.idCaderno, marcadas)
					.then(function (resultado) {
						var correcoes = resultado.correcoes;

						if (resultado.conquistouInvestida) {
							exibirAlertaInvestidaCompleta();
						}

						angular.forEach(marcadas, function (questao) {
							for (var i = 0; i < correcoes.length; i++) {
								var questaoResultado = correcoes[i];
								if (questao.idQuestao === questaoResultado.idQuestao) {
									if (questao.posicaoCaderno == vm.caderno.numeroQuestaoAtual) {
										// Recarrega os dados da questão para caso volte para a aba de questões
										$scope.$parent.main.recarregarQuestao(questao.posicaoCaderno);
									}

									questao.acertou = questaoResultado.acertou;
									questao.data = questaoResultado.data;
									correcoes.splice(i, 1);
									break;
								}
							}
						});

						if (resultado.finalizado) {
							vm.caderno.numeroEmBranco = 0;
							factory.finalizarCaderno(vm.caderno);
						}

						vm.fezModificacoes = false;
					});
			}
		}

		function buscarDados(substituir) {
			if (substituir) {
				tratarAlteracoes(buscarDados);
			} else {
				buscarDados();
			}

			function buscarDados() {
				if (substituir) {
					vm.pagina = 1;
				}

				// A página só é avançada após a resposta com sucesso, para que uma
				// requisição barrada (ex.: captcha) possa ser repetida sem pular página
				var pagina = substituir ? vm.pagina : vm.pagina + 1;

				var parametros = {
					"pagina": pagina,
					"exibicao": vm.exibicaoAtual.codigo
				};

				if (vm.irPara) {
					parametros["irPara"] = vm.irPara;
				}

				if (vm.busca) {
					parametros["busca"] = vm.busca;
				}

				factory.buscarDadosGabarito(vm.caderno.idCaderno, parametros)
					.then(function(dados){
						if (!dados) {
							return;
						}

						vm.pagina = pagina;
						vm.total = dados.resultCount;
						if (substituir) {
							vm.gabarito = dados.list;
						} else {
							vm.gabarito = vm.gabarito.concat(dados.list);
						}

						for (var i = 0; i < dados.list.length; i++) {
							var questao = dados.list[i];
							if (!!questao.alternativa && !questao.anulada && (questao.acertou === undefined || questao.acertou === null)) {
								vm.fezModificacoes = true;
								break;
							}
						}
					});
			};
		}

		function setupAvisoAlteracoes() {
			// Sistema do browser que vai alertar no reload, sair da pagine, seguir link, etc.
			window.addEventListener("beforeunload", function (e) {
				if (!vm.fezModificacoes) {
					return null;
				}

				e.preventDefault();
				return e.returnValue = "Confirma?";
			});

			// Trata mudança de view pelo angular
			$scope.$on('$locationChangeStart', function(event, next, current) {
				tratarAlteracoes(function() {});
			});

			// Trata troca de aba do caderno
			vm.selecionarAbaAnterior = $scope.$parent.main.onSelecionarAba;

			$scope.$parent.main.onSelecionarAba = function (aba, $event) {
				tratarAlteracoes(function() {
					$scope.$parent.main.onSelecionarAba = vm.selecionarAbaAnterior;
					$scope.$parent.main.onSelecionarAba(aba, $event);
				});
			}
		}

		function tratarAlteracoes(callback) {
			if (!vm.fezModificacoes) {
				callback();
				return;
			}

			alertify.confirm(
				"Alterações nao foram salvas",
				"As alternativas assinaladas nesta tela ainda não foram resolvidas. Deseja resolvê-las ou descartar as alterações?",
				function() {
					resolverMarcadas().then(callback);
				},
				function() {
					vm.fezModificacoes = false;
					callback();
				}
			).setting("labels", { ok: "Resolver", cancel: "Descartar" });
		}
	}
})();
