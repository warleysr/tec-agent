(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("TecCadernoEstatisticasController", TecCadernoEstatisticasController);

	TecCadernoEstatisticasController.$inject = ["$scope", "$window", "tec", "tecDadosCaderno"];

	function TecCadernoEstatisticasController($scope, $window, tec, factory) {
		var vm = this;

		vm.idCaderno = vm.caderno.idCaderno;

		vm.assinante = $.isAssinanteLogado();
        vm.assinanteAvancado = $.isAssinanteAvancadoLogado();

        vm.mostrarAlertaPlanoAvancado = mostrarAlertaPlanoAvancado;
        vm.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;

		// GRÁFICO

		vm.options = {
			aspectRatio: 1,
			mantainAspectRatio: false,
			tooltips: {
				callbacks: {
					label: function(tooltipItem, data) {
						var label = data['labels'][tooltipItem['index']];
						var data = data['datasets'][0]['data'][tooltipItem['index']];

						if (label) {
							return label + ': ' + data + '%';
						} else {
							return data + '%';
						}
					}
				}
			},
			legend: {
			  display: true
			}
		};

		vm.apenasResolvidas = false;
		vm.modoCespe = false;
		vm.exbirDemaisUsuarios = false;

		vm.onPontuacaoAlterada = onPontuacaoAlterada;
		vm.onExibirDemaisUsuarios = onExibirDemaisUsuarios;

		// INDICADORES

		vm.abrirModalGerarCaderno = abrirModalGerarCaderno;
		vm.gerarNovoCaderno = gerarNovoCaderno;
		vm.apagarResolucoes = apagarResolucoes;
		vm.apagarResolucoesCertas = apagarResolucoesCertas;
		vm.apagarResolucoesErradas = apagarResolucoesErradas;
		vm.apagarResolucoesFavoritas = apagarResolucoesFavoritas;
		vm.apagarResolucoesAnotadas = apagarResolucoesAnotadas;
		vm.zerarCronometro = zerarCronometro;

		vm.modalGerar = {
			nome: null,
			pasta: null,
			subpasta: null,
			tipo: null,
		};

		vm.tipoCadernoGerado = {
			DUPLICAR: {
				prefixo: "Cópia: ",
				chamadaApi: factory.duplicarCaderno,
			},
        	RESOLVIDAS: {
				prefixo: "Resolvidas: ",
				chamadaApi: factory.gerarCadernoQuestoesResolvidas,
			},
            ACERTOS: {
				prefixo: "Corretas: ",
				chamadaApi: factory.gerarCadernoQuestoesCertas,
			},
            ERROS: {
				prefixo: "Erradas: ",
				chamadaApi: factory.gerarCadernoQuestoesErradas,
			},
        	BRANCO: {
				prefixo: "Em Branco: ",
				chamadaApi: factory.gerarCadernoQuestoesEmBranco,
			},
            FAVORITAS: {
				prefixo: "Favoritas: ",
				chamadaApi: factory.gerarCadernoQuestoesFavoritas,
			},
			ANOTADAS: {
				prefixo: "Anotadas: ",
				chamadaApi: factory.gerarCadernoQuestoesAnotadas,
			},
			ERROS_DESEMPENHO: {
				prefixo: "Erradas: ",
				chamadaApi: factory.gerarCadernoQuestoesErradasComFiltro,
			},
			RESOLVIDAS_DESEMPENHO: {
				prefixo: "Resolvidas: ",
				chamadaApi: factory.gerarCadernoQuestoesResolvidasComFiltro,
			},
		};

		// DESEMPENHO

		vm.quantidadeSelecionado = 0;
		vm.nomeNovoCaderno = "Caderno de Questoes que Resolvi";
		vm.selecionadoCadernoDeErradas = false;
		vm.cadernoSendoGerado = false;

		vm.onSelecaoAlterada = onSelecaoAlterada;
		vm.onMateriaExpandida = onMateriaExpandida;

		// TEORIA

		vm.possuiTeoria = false;

		vm.onMarcarAssuntoComoLido = onMarcarAssuntoComoLido;
		vm.onDesmarcarAssuntoComoLido = onDesmarcarAssuntoComoLido;

		activate();

		function activate() {
			factory.buscarResumoCaderno(vm.idCaderno)
				.then(function(data) {
					vm.resumo = data.caderno;

					if (vm.resumo.tipoCaderno == 'DISCURSIVA') {
						vm.dadosGraficoDiscursiva = [vm.resumo.porcentagemAcertos, vm.resumo.porcentagemEmBranco];
						vm.descricaoGraficoDiscursiva = "Desempenho no caderno. Resolvidas: " + vm.resumo.porcentagemAcertos + "%, Em branco: " + vm.resumo.porcentagemEmBranco + "%"
					} else {
						vm.dadosGraficoGeral = [vm.resumo.porcentagemAcertos, vm.resumo.porcentagemErros, vm.resumo.porcentagemEmBranco, vm.resumo.porcentagemAnuladas];
						vm.descricaoGraficoGeral = "Desempenho geral no caderno. Acertos: " + vm.resumo.porcentagemAcertos + "% , Erros: " + vm.resumo.porcentagemErros +
						 "%, Em branco: " + vm.resumo.porcentagemEmBranco +	 "% , Anuladas: " + vm.resumo.porcentagemAnuladas + "%";

						vm.dadosGraficoResolvidas = [vm.resumo.porcentagemRelativaAcertos, vm.resumo.porcentagemRelativaErros];
						vm.descricaoGraficoResolvidas = "Desempenho sobre resolvidas. Acertos: " + vm.resumo.porcentagemRelativaAcertos + "%, Erros: " + vm.resumo.porcentagemRelativaErros + "%";

						if (vm.resumo.numeroQuestoesResolvidas != 0) {
							var valorCespe = 100 * ((vm.resumo.numeroAcertos - vm.resumo.numeroErros) / vm.resumo.numeroQuestoesResolvidas);
							vm.valorCespe = valorCespe.toFixed(2);
							vm.dadosGraficoCespe = [Math.abs(valorCespe).toFixed(2), (100 - Math.abs(valorCespe)).toFixed(2) ];
							vm.coresGraficoCespe = [ (valorCespe < 0) ? '#F03024' : '#63DD63', '#EEEEEE' ];
							vm.labelsGraficoCespe = [ (valorCespe < 0) ? 'Erros' : 'Acertos'];
							vm.descricaoGraficoCespe = "Desempenho líquido: " + valorCespe.toFixed(2) + "%";
						} else {
							vm.valorCespe = 0;
							vm.dadosGraficoCespe = [0, 100];
							vm.coresGraficoCespe = ['#63DD63', '#EEEEEE'];
							vm.labelsGraficoCespe = ['Acertos'];
							vm.descricaoGraficoCespe = "Desempenho líquido: 0%";
						}
					}

					if (vm.resumo.porcentagemTeoriaLida) {
						vm.possuiTeoria = true;
					}

					vm.dificuldadeMedia = Math.round(vm.resumo.dificuldadeMedia);
					buscarDesempenhoCaderno();
				});
		}

		function buscarPastas() {
			if (factory.pastas.length != 0) {
				return;
			}

			factory.listarPastas()
				.then(function(data) {
					factory.pastas = data.pastas;
					vm.pastas = factory.pastas;

					vm.subpastasPorPasta = {};
					$(vm.pastas).each(function(_, pasta) {
						if (!!pasta.subpastas && pasta.subpastas.length > 0) {
							vm.subpastasPorPasta[pasta.id] = pasta.subpastas
						}
					});
				});
		}

		function onPontuacaoAlterada() {
			if (vm.modoCespe) {
				vm.apenasResolvidas = true;
			} else if (vm.resumo.numeroQuestoesResolvidas == 0) {
				vm.apenasResolvidas = false;
			}
		}

		function onExibirDemaisUsuarios() {
			factory.buscarDesempenhoDemaisUsuarios(vm.idCaderno).then(function(data) {
				if (data.double <= 0) {
					vm.demaisUsuariosSemDados = true;
					return;
				}

				var erros = (100 - data.double).toFixed(1);

				vm.dadosGraficoDemaisUsuarios = [data.double, erros];
				vm.descricaoGraficoDemaisUsuarios = "Desempenho dos demais usuários. Acertos: " + data.double + "%, Erros: " + erros + "%";

				var valorCespe = data.double - erros;
				vm.valorCespeDemaisUsuarios = valorCespe.toFixed(2);
				vm.dadosGraficoCespeDemaisUsuarios = [Math.abs(valorCespe).toFixed(2), (100 - Math.abs(valorCespe)).toFixed(2) ];
				vm.coresGraficoCespeDemaisUsuarios = [ (valorCespe < 0) ? '#F03024' : '#63DD63', '#EEEEEE' ];
				vm.labelsGraficoCespeDemaisUsuarios = [ (valorCespe < 0) ? 'Erros' : 'Acertos'];
				vm.descricaoGraficoCespeDemaisUsuarios = "Desempenho líquido dos demais usuários: " + valorCespe.toFixed(2) + "%";

				vm.exbirDemaisUsuarios = true;
			});
		}

		// INDICADORES

		function abrirModalGerarCaderno(tipo) {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			buscarPastas();

			vm.modalGerar.tipo = tipo;
			vm.modalGerar.nome = vm.tipoCadernoGerado[tipo].prefixo + vm.caderno.nome;
			vm.modalGerar.pasta = parseInt(vm.idPasta);
		}

		function gerarNovoCaderno() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			var chamadaApi = vm.tipoCadernoGerado[vm.modalGerar.tipo].chamadaApi;
			montarParametrosGerador();

			chamadaApi(vm.idCaderno, vm.modalGerar, vm.dadosGerador)
				.then(function (dados) {
					if (dados.erro) {
						tec.alert("Não foi possivel criar o caderno: " + dados.mensagem, "Atenção!");
						return;
					}

					var idCadernoNovo = dados.long;
					$window.location = contextPathUrl + "questoes/cadernos/" + idCadernoNovo + "/caderno";
				});
		}

		function apagarResolucoes() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			tec.confirm("Tem certeza de que deseja zerar todas as resoluções desse caderno?", "Zerar resoluções", function(confirma) {
				if (confirma) {
					factory.zerarResolucoes(vm.idCaderno)
						.then(function(){
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});
		}

		function apagarResolucoesCertas() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			tec.confirm("Tem certeza de que deseja zerar todas as resoluções certas desse caderno?", "Zerar resoluções", function(confirma) {
				if (confirma) {
					factory.zerarResolucoesCertas(vm.idCaderno)
						.then(function(){
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});
		}

		function apagarResolucoesErradas() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			tec.confirm("Tem certeza de que deseja zerar todas as resoluções erradas desse caderno?", "Zerar resoluções", function(confirma) {
				if (confirma) {
					factory.zerarResolucoesErradas(vm.idCaderno)
						.then(function(){
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});
		}
		
		function apagarResolucoesFavoritas() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			tec.confirm("Tem certeza de que deseja zerar todas as resoluções de questões favoritas deste caderno?", "Zerar resoluções", function(confirma) {
				if (confirma) {
					factory.zerarResolucoesFavoritas(vm.idCaderno)
						.then(function(){
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});
			
		}

		function apagarResolucoesAnotadas() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			tec.confirm("Tem certeza de que deseja zerar todas as resoluções de questões anotadas deste caderno?", "Zerar resoluções", function(confirma) {
				if (confirma) {
					factory.zerarResolucoesAnotadas(vm.idCaderno)
						.then(function(){
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});

		}

		function zerarCronometro(context) {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			var mensagem = "Tem certeza de que deseja zerar o cronômetro? Os dados de tempo gasto por questão coletados neste caderno serão perdidos e passarão a ser baseados no novo tempo. Confirma a operação?";

			tec.confirm(mensagem, "Zerar o cronômetro", function(confirma) {
				if (confirma) {
					factory.zerarCronometro(vm.idCaderno)
						.then(function() {
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.idCaderno + "/caderno";
						});
				}
			});
		}

		// DESEMPENHO

		function buscarDesempenhoCaderno() {
			if (vm.resumo.tipoCaderno != 'OBJETIVA') {

				factory.buscarMateriasCaderno(vm.idCaderno).then(function(dados) {
					vm.dadosTabelaDesemepnho = dados.desempenho;
				});
			} else {
				factory.buscarDesempenhoCaderno(vm.idCaderno)
					.then(function(dados) {
						vm.dadosTabelaDesemepnho = dados.desempenho;
					});
			}
		}

		function onSelecaoAlterada(selecao, resolvidas) {
			vm.dadosGerador = [];
			if (selecao.tipo === "todos") {
				var quantidade = 0;

				if (selecao.selecionado) {
					for (var i = 0; i < vm.dadosTabelaDesemepnho.length; i++) {
						var materia = vm.dadosTabelaDesemepnho[i];

						quantidade += obterAlteracaoQuantidadeMateria(materia, resolvidas);
					}
				}

				vm.quantidadeSelecionado = quantidade
			} else if (selecao.tipo === "materia") {
				var materia = selecao.materia;

				vm.quantidadeSelecionado += obterAlteracaoQuantidadeMateria(materia, resolvidas);
			} else if (selecao.tipo === "assunto") {
				var assunto = selecao.assunto;

				vm.quantidadeSelecionado += obterAlteracaoQuantidadeAssunto(assunto, resolvidas);
			}
		}

		function onMateriaExpandida(materia) {
			factory.buscarDesempenhoCaderno(vm.idCaderno, materia.id)
				.then(function(assuntos) {
					materia.assuntos = assuntos.desempenho;

					if (materia.selecionado) {
						vm.quantidadeSelecionado -= 1; // Vai fazer a recontagem dos assuntos depois
					}
				});
		}

		function obterAlteracaoQuantidadeMateria(materia, resolvidas) {
			if (materia.assuntos) {
				var quantidade = 0;

				for (var i = 0; i < materia.assuntos.length; i++) {
					quantidade += obterAlteracaoQuantidadeAssunto(materia.assuntos[i], resolvidas);
				}

				return quantidade;
			} else {
				if (!resolvidas || (materia.acertos + materia.erros > 0) ) {
					return materia.selecionado ? 1 : 0;
				} else {
					return 0;
				}
			}
		}

		function obterAlteracaoQuantidadeAssunto(assunto, resolvidas) {
			if (assunto.subTree) {
				var quantidade = 0;

				for (var i = 0; i < assunto.subTree.length; i++) {
					quantidade += obterAlteracaoQuantidadeAssunto(assunto.subTree[i], resolvidas);
				}

				return quantidade;
			} else {
				if (!resolvidas || (assunto.acertos + assunto.erros > 0) ) {
					return assunto.selecionado ? 1 : -1;
				} else {
					return 0;
				}
			}
		}

		function montarParametrosGerador() {
			if (vm.dadosGerador && vm.dadosGerador.length > 0) {
				return;
			}

			vm.dadosGerador = [];
			for (var i = 0; i < vm.dadosTabelaDesemepnho.length; i++) {
				var materia = vm.dadosTabelaDesemepnho[i];

				if (materia.assuntos && materia.expandir) {
					montarParametrosAssuntosGerador(materia.assuntos, materia.id);
				} else if (materia.selecionado) {
					vm.dadosGerador.push({ tipo: "MATERIA", id: materia.id });
				}
			}
		}

		function montarParametrosAssuntosGerador(assuntos, idMateria) {
			for (var i = 0; i < assuntos.length; i++) {
				var assunto = assuntos[i];

				if (assunto.selecionado) {
					if (assunto.id) {
						vm.dadosGerador.push({ tipo: "ASSUNTO", id: assunto.id });
					} else {
						vm.dadosGerador.push({ tipo: "SEM_CLASSIFICACAO_ASSUNTO", id: idMateria });
					}
				} else if (assunto.subTree) {
					montarParametrosAssuntosGerador(assunto.subTree);
				}
			}
		}

		// TEORIA
		function buscarPorcentagemTeoriaLida() {
			if (!vm.possuiTeoria) {
				return;
			}

			factory.buscarPorcentagemTeoriaLida(vm.idCaderno)
				.then(function (dados) {
					vm.resumo.porcentagemTeoriaLida = dados;
				});
		}

		function onMarcarAssuntoComoLido(assunto) {
			factory.alterarCapituloLido(assunto.idCapitulo, true)
				.then(function() {
					assunto.lido = true;
					buscarPorcentagemTeoriaLida();
				});
		}

		function onDesmarcarAssuntoComoLido(assunto) {
			factory.alterarCapituloLido(assunto.idCapitulo, false)
				.then(function() {
					assunto.lido = false;
					buscarPorcentagemTeoriaLida();
				});
		}

		// ALERTAS

		function mostrarAlertaPlanoAvancado() {
			tec.alert("Esta funcionalidade está disponível para assinantes do Plano Avançado. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
		}

		function mostrarAlertaExclusivoParaAssinantes() {
			tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
		}
	}
})();
