(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("MainCadernoController", MainCadernoController);

	MainCadernoController.$inject = ["$scope", "$window", "$interval", "$location", "tecDadosCaderno", "tec"]

	function MainCadernoController($scope, $window, $interval, $location, factory, tec) {
		var main = this;

		main.factory = factory;

		main.cadernoCarregado = false;
		main.caminhoExpandido = false;
		main.menuExpandirQuestaoAberto = false;

		main.capituloAberto = {
			id: null,
			aberto: false,
			modoLeitura: false
		};


		main.modoLeitura = false;
		main.abas = {
			QUESTAO: 'questao',
			INDICE: 'indice',
			ESTATISTICA: 'estatistica',
			GABARITO: 'gabarito',
			CONFIGURACOES: 'configuracoes',
			IMPRESSAO: 'impressao',
			SEM_ACESSO: 'sem_acesso'
		};
		
	    const params = new URLSearchParams(window.location.search);
	    
	    if (params.get("aba") === "configuracoes") {
			main.abaSelecionada = main.abas.CONFIGURACOES;
		} else {
			main.abaSelecionada = main.abas.QUESTAO;			
		}

		main.toggleExibirCaminho = toggleExibirCaminho;
		main.mostrarDropdownExpandirQuestao = mostrarDropdownExpandirQuestao;
		main.expandirTamanhoHorizontal = expandirTamanhoHorizontal;
        main.reduzirTamanhoHorizontal = reduzirTamanhoHorizontal;
        main.voltarTamanhoHorizontalPadrao = voltarTamanhoHorizontalPadrao;
		main.toggleModoLeitura = toggleModoLeitura;
		main.sairModoLeitura = sairModoLeitura;
		main.pausarRelogio = pausarRelogio;
		main.estaNoApp = estaNoApp;
		main.onSelecionarAba = onSelecionarAba;
		main.onCompartilharCaderno = onCompartilharCaderno;
		main.abrirQuestaoPorIndice = abrirQuestaoPorIndice;
		main.recarregarQuestao = recarregarQuestao;
		main.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;
		main.mudarAbaMobile = mudarAbaMobile;

		ativar();

		function ativar() {
			main.caderno = jsonCaderno;

			var exibir = JSON.parse(localStorage.getItem("tec.exibirCaminhoCaderno" + "["+userId+"]"));

			if (typeof exibir === 'boolean') {
				main.caminhoExpandido = exibir;
			}

			factory.relogio.inicializar(main.caderno.tempoTotalCronometroSegundos, main.caderno.finalizado);

			var relogioPausado = JSON.parse(localStorage.getItem("tec.cadernoRelogioPausado" + "["+userId+"]"));

			if (typeof relogioPausado === 'boolean' && main.caderno.tempoTotalCronometroSegundos > 0) {
				factory.relogio.pausa = relogioPausado;
			}

			// Para caso saia do modo leitura por tecla ESC ou F11 ao invés de usar o botão da tela ou atalho.
			$(document).on('fullscreenchange', function(e) {
				var fullscreen = document.fullscreenElement
					|| document.webkitFullscreenElement
					|| document.mozFullscreenElement
					|| document.msFullscreenElement;

				if (!fullscreen && main.modoLeitura) {
					$scope.$apply(function() {
						main.modoLeitura = false;
					});

					tec.sairFullScreen();
					$('#header, #rodape, #caderno-rodape-links').show();
				}
			});

			inicializarExpandirQuestao();

			inicializarAbaQuestao();
			
			enviarPostMessageParaParent();
			
			iniciarListenerMessage();
		}
		
		function  iniciarListenerMessage() {
			window.addEventListener('message', (event) => {
				if (event.data.type === 'EXPAND_HORIZONTAL') {
					expandirTudoHorizontalmente();
				}
			});
		}
		
		function enviarPostMessageParaParent() {
			window.parent.postMessage({ type: 'CONTENT_READY' });
		}
		
		function expandirTudoHorizontalmente() {
			var tamanho = obterTamanhoHorizontalConfigurado(true);
			
			if (tamanho > 100) {
				return;
			}
			
			var tamanhoMaximo = 91;
			$('.container').css('width', tamanhoMaximo + '%');
			localStorage.setItem("tec.expandirQuestaoCaderno", tamanhoMaximo);
		}

		function inicializarAbaQuestao() {
			var promiseFavorita = factory.buscaFavoritasDoCaderno(main.caderno.idCaderno)
				.then(function(data) {
					if (data && data.listaFavoritas) {
						main.caderno.listaFavoritas = data.listaFavoritas;
					}
				});

			var promiseAnotada = factory.buscaAnotadasDoCaderno(main.caderno.idCaderno)
				.then(function(data) {
					if (data && data.listaAnotadas) {
						main.caderno.listaAnotadas = data.listaAnotadas;
					}
				});

			Promise.all([promiseFavorita, promiseAnotada]).then(function() {
				main.cadernoCarregado = true;
			});

			$(document).on("keydown", function(e) {
				if (main.abaSelecionada != main.abas.QUESTAO) {
					return;
				}

				var activeElement = $(document)[0].activeElement;
				var tag = activeElement.tagName.toUpperCase();
				var isInputText = $(document.activeElement).is('input:text');

				var modifier = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;
				if (!modifier && e.keyCode == 82) {
					if (tag != 'TEXTAREA' && !isInputText && activeElement.contentEditable != 'true') {
						tec.confirm("Deseja remover esta questão deste caderno?", "Confirmação", function(result) {
							if (result) {
								factory.removerQuestaoAtual(main.caderno.idCaderno)
									.then(function() {
										factory.cacheAssuntos = [];
										$window.location.href = contextPathUrl + 'questoes/cadernos/' + main.caderno.idCaderno + '/';
									});
							}
						});
					}
				}
			});
		}

		function toggleExibirCaminho(exibir) {
			main.caminhoExpandido = exibir;

			localStorage.setItem("tec.exibirCaminhoCaderno" + "["+userId+"]", exibir);
		}

		function inicializarExpandirQuestao() {
			if ($.isMobileOrTabletBrowser() || $.isApp()) {
				return;
			}

			var expandirConfigurado = obterTamanhoHorizontalConfigurado(false);

			if (!!expandirConfigurado) {
				$('.container').css('width', expandirConfigurado + '%');
			}

			$(window).on("resize", function() {
				// Breakpoint $screen-lg-min usado nas @media queries
				if ($(window).width() < 1200) {
					$('.container').css('width', '');

					$scope.$apply(function() {
						main.menuExpandirQuestaoAberto = false;
						$("#wrapper-expandir-questao").removeClass("active");
						$("#botao-expandir-questao").removeClass("glyphicon-ativo");
						$("#botao-expandir-questao").tooltip("enable");
					});
				}
			});

			$(document).click(function (event) {
				if (!main.menuExpandirQuestaoAberto) {
					return;
				}

				var target = $(event.target);

				if (!target.closest('#expandir-questao').length) {
					$scope.$apply(function() {
						main.menuExpandirQuestaoAberto = false;
						$("#wrapper-expandir-questao").removeClass("active");
						$("#botao-expandir-questao").removeClass("glyphicon-ativo");
						$("#botao-expandir-questao").tooltip("enable");
					});
				}
			});
		}

		function mostrarDropdownExpandirQuestao() {
			main.menuExpandirQuestaoAberto = true;

			$("#wrapper-expandir-questao").addClass("active");
			$("#botao-expandir-questao").addClass("glyphicon-ativo");
			$("#botao-expandir-questao").tooltip("disable");
		}

		function expandirTamanhoHorizontal() {
			var tamanho = obterTamanhoHorizontalConfigurado(true);

			var tamanhoNovo = tamanho + 10;
			if (tamanhoNovo > 100) {
				return;
			}

			$('.container').css('width', tamanhoNovo + '%');

			localStorage.setItem("tec.expandirQuestaoCaderno" + "["+userId+"]", tamanhoNovo);
		}

		function reduzirTamanhoHorizontal() {
			var tamanho = obterTamanhoHorizontalConfigurado(true);

			var tamanhoNovo = tamanho - 10;
			if (tamanhoNovo < Math.round((1170/$(window).width()) * 100)) {
				return;
			}

			$('.container').css('width', tamanhoNovo + '%');

			localStorage.setItem("tec.expandirQuestaoCaderno" + "["+userId+"]", tamanhoNovo);
		}

		function voltarTamanhoHorizontalPadrao() {
			$('.container').css('width', '');

			localStorage.removeItem("tec.expandirQuestaoCaderno" + "["+userId+"]");
		}

		function obterTamanhoHorizontalConfigurado(calcularBase) {
			var porcentagemSalva = localStorage.getItem("tec.expandirQuestaoCaderno" + "["+userId+"]");

			if (!!porcentagemSalva) {
				return parseInt(porcentagemSalva);
			} else if (!calcularBase) {
				return null;
			} else {
				/*
					O espaço central tem um tamanho fixo de 1170px (ver $container-lg nos arquivos scss).
					Isso causa problemas para fazer o aumento correto do tamanho horizontal:

					- Caso o aumento fosse feito por porcentagem, a porcentegem inicial vai depender do tamanho da tela
					  do usuário, e dependendo do valor inicial é posivel que ao aumentar o tamanho fique menor.
						Ex.: Para a resolução padrão 1920x1080, 1170 é ~61%, porém para a resolução mais comum entre
						ultrawides (3440x1440), 1170 é ~34%. Então se começar com um valor fixo de 30%, ao aumentar
						em 10%, usuarios com tela 1920x1080 veriam uma redução do tamanho horizontal.
					  A solução para esse problema seria ter um começo relativo. Calculando a porcentagem com base no
					  tamanho da janela atual conseguimos ter um valor inicial mais próximo do real. Porém essa não é
					  uma solução perfeita, por que como praticamente a porcentagem real nunca vai ser um valor redondo,
					  a primeira (se arrendondarmos o valor inicial) ou a ultíma (devido a limitar a 100%) alteração
					  não tera a mesma "magnitude" dos outros.
					  	Ex.: para uma porcentagem inicial de 53%, podemos fazer um acréscimo inicial de 7% ou
					  	arrendodar para 50% e fazer um acréscimo de 10% (com mesmo efeito). Para uma porcentagem de
					  	57%, ou fazemos um acréscimo inicial de 3% ou arredondamos para 60% e faz o acréscimo normal de
					  	10% (efetivamente um acréscimo de 13%).

					- Caso o aumento fosse feito por pixels, teria que ser definido quantos pixels usar em cada
					  "aumentada". Porém dependendo da resolução do usuário a quantidade pode acabar sendo pouco/muito.
					  	Ex.: Para a resolução padrão 1920x1080, aumetar por 100px precisaria de 7-8 aumentadas para
					  	chegar ao máximo, porém em ultrawides com resolução 3440x1440 precisaria de 23-24.
					  Uma solução para isso seria definir um valor relativo de forma a se ter uma número fixo de passos.
					  Para isso bastaria subtrair 1170 do tamanho atual da janela e dividir esse valor pelo numero de
					  passos (e arredondar para baixo para não ter problema de precisão).

					Independente da solução, como ambas utilizam o tamanho da janela atual, ambas possuem o mesmo
					problema de mudança da janela. Caso o usuário tenha mais de um monitor com resoluções diferentes,
					ou até mesmo se ele redimencionar a janela, o valor calculado vai estar errado. Isso é pior no
					caso do aumento por pixels pois o resultado seria um tamanho fixo e poderia até ultrapassar o novo
					tamanho da janela, além do fato que teria que ser calculado um novo tamanho de passo que geraria
					tamanhos "incoerentes".
						Ex.: Se inicialmente o passo fosse 100px, 1170 + 100 = 1270. Mas se ao mudar o tamanho da janela
						o passo passase, por exemplo, para 30px, qualquer alteração geraria um valor que não é obtível
						por qualquer um dos dois passos:
							1270 + 30 = 1300 e 1270 - 30 = 1240, que não estão entre as seguintes opções:
							+100 -> 1170 - 1270 - 1370 ...
							+30  -> 1170 - 1200 - 1230 - 1260 - 1290 - 1320 ...

					Devido a estes fatores, decidi que a melhor solução seria realmente calcular a porcentagem base
					caso seja a primeira alterção.
				 */
				var tamanhoJanela = $(window).width();

				return Math.round((1170/tamanhoJanela) * 100);
			}
		}

		function toggleModoLeitura() {
			if (!tec.estaEmFullScreen() && main.modoLeitura == false) {
				main.modoLeitura = true;
				tec.exibirFullScreen(document.documentElement);
				$('#header, #rodape, #caderno-rodape-links').hide();
			} else {
				main.modoLeitura = false;
				tec.sairFullScreen();
				$('#header, #rodape, #caderno-rodape-links').show();
			}
		}

		function sairModoLeitura() {
			main.modoLeitura = false;

			if (tec.estaEmFullScreen()) {
				tec.sairFullScreen();
				$('#header, #rodape, #caderno-rodape-links').show();
			}
		}

		function pausarRelogio() {
			if (main.caderno.finalizado) {
				return;
			}

			if (!factory.relogio.pausa) {
				factory.relogio.pausa = true;
				factory.pausarResolucao(main.caderno.idCaderno);
			} else {
				factory.relogio.pausa = false;
				factory.despausarResolucao(main.caderno.idCaderno);
			}

			localStorage.setItem("tec.cadernoRelogioPausado" + "["+userId+"]", factory.relogio.pausa);
		}

		function estaNoApp() {
			return $.isApp();
		}

		function onSelecionarAba(aba, $event) {
			main.abaSelecionada = aba;

			if ($event && $event.currentTarget) {
				$event.currentTarget.blur();
			}
		}

		function onCompartilharCaderno() {
			factory.compartilharCaderno(main.caderno.idCaderno)
				.then(function(data) {
					var urlShortCaderno = data.links[0];
					var urlCaderno = data.links[1];
					var mensagem = tec.mensagemCompartilhamento(urlShortCaderno, urlCaderno);
					$.alerts.alert(mensagem, "Compartilhar caderno");
				});
		}

		function abrirQuestaoPorIndice(numeroQuestao) {
			main.abaSelecionada = main.abas.QUESTAO;
			recarregarQuestao(numeroQuestao);
		}

		function recarregarQuestao(numeroQuestao) {
			$scope.$broadcast("abrir-questao", numeroQuestao);
		}

		function mostrarAlertaExclusivoParaAssinantes() {
			tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
		}
		
		function mudarAbaMobile() {			
			if (main.abaSelecionada != main.abas.SEM_ACESSO) {
				main.abaSelecionadaAnterior = main.abaSelecionada;
			} else {
				main.mostrarAlertaExclusivoParaAssinantes();
				if (!main.abaSelecionadaAnterior) {
					main.abaSelecionada = main.abas.QUESTAO;
				} else {
					main.abaSelecionada = main.abaSelecionadaAnterior;
				}
			}
		}
	}
})();
