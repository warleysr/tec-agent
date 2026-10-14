(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("TecCadernoIndiceController", TecCadernoIndiceController);

	TecCadernoIndiceController.$inject = ["$scope", "tec", "tecDadosCaderno"];

	function TecCadernoIndiceController($scope, tec, factory) {
		var vm = this;

		vm.assuntos = [];
		vm.descricaoNumeroAnuladas = "";
		vm.indiceEmEdicao = false;
		vm.todosSelecionados = false;
		vm.organizadoPor = {};
		vm.distribuidoPor = {};
		vm.temFilhos = temFilhos;
		vm.recolherOuExpandirArvore = recolherOuExpandirArvore;
		vm.expandirAssunto = expandirAssunto;
		vm.irParaQuestao = irParaQuestao;
		vm.organizarIndice = organizarIndice;
		vm.mostrarDistribuicaoPorIndice = mostrarDistribuicaoPorIndice;
		vm.mostrarDistribuicaoPorQuantidade = mostrarDistribuicaoPorQuantidade;
		vm.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;
		vm.carregarPreferenciaDistribuicao = carregarPreferenciaDistribuicao;
		vm.alterarPreferenciaDistribuicao = alterarPreferenciaDistribuicao;
		vm.onEditarCaderno = onEditarCaderno;
		vm.inicializar = inicializar;
		vm.indiceSalvo = null;

		vm.onCancelarEdicao = onCancelarEdicao;
		vm.onFinalizarEdicao = onFinalizarEdicao;
		vm.onSelecaoAlterada = onSelecaoAlterada;
		vm.onSelecionarTodos = onSelecionarTodos;
		vm.quantidadeSelecionados = 0;
		vm.ordenarPor = ordenarPor;
		
		// Excel
		vm.onExportarExcel = onExportarExcel;
		vm.mostrarAlertaPlanoAvancado = mostrarAlertaPlanoAvancado;
		vm.assinanteAvancado = $.isAssinanteAvancadoLogado();

		inicializar();

		function inicializar() {
			vm.descricaoNumeroAnuladas = getDescricaoNumeroAnuladas();
			vm.indiceSalvo = vm.caderno.indiceSalvo;

			//indice
			if (factory.cacheAssuntos.length == 0 || vm.caderno.recarregarIndice) {
				carregarIndice(vm.indiceSalvo);
				vm.caderno.recarregarIndice = false;
			} else {
				vm.assuntos = factory.cacheAssuntos;
				limparSelecao(vm.assuntos);
			}
			
			factory.carregarTiposDeIndice().then(function(data) {
				console.log(data);
				factory.tiposDeIndice = data.organizacaoList;
				vm.organizadoPor = getOrganizacao(vm.indiceSalvo);
			});

			vm.carregarPreferenciaDistribuicao();
			
			dropDownSubMenuCtrl();
		}
		
		function dropDownSubMenuCtrl() {
			angular.element(document).ready(function () {
				$('li.dropdown-submenu a[data-toggle="dropdown"]').on('click', function(event) {
				    event.preventDefault();
				    event.stopPropagation();
				    $('li.dropdown-submenu').not($(this).parent()).removeClass('open');
				    $(this).parent().toggleClass('open');
				 });
		    });
		}
		

		function contarQuestoes(elemento, ordem) {
			if (elemento.subTree && elemento.subTree.length > 0) {
				$(elemento.subTree).each(function(index, filho) {
					var contagemQuestoes = contarQuestoes(filho, ordem);
					if (ordem == 'MATERIA' || ordem == 'RELEVANCIA') {
						elemento.contagem += contagemQuestoes;
					}
				});
			}
			if (vm.caderno.numeroTotalQuestoes) {
				var porcentagem = parseFloat(elemento.contagem) / parseFloat(vm.caderno.numeroTotalQuestoes) * 100;
				elemento.porcentagem = porcentagem.toFixed(2) + "%";

			}
			return elemento.contagem;
		}

		function temFilhos(assunto) {
			return assunto.subTree && assunto.subTree.length > 0;
		}
		function expandirAssunto(assunto) {
			assunto.ocultar = !assunto.ocultar;
		}
		function recolherOuExpandirArvore(assuntos, recolher) {
			$(assuntos).each(function(index, assunto) {
				assunto.ocultar = recolher;
				if (vm.temFilhos(assunto)) {
					recolherOuExpandirArvore(assunto.subTree, recolher);
				}
			});
		}
		function irParaQuestao(numeroQuestao) {
			factory.alterarQuestaoAtual(vm.caderno.idCaderno, numeroQuestao)
				.then(function() {
					vm.onAbrirQuestao(numeroQuestao);
				})
		}

		function onExportarExcel() {
			if (!vm.assinanteAvancado) {
				vm.mostrarAlertaPlanoAvancado();
				return;
			}

			factory.downloadIndiceCaderno(vm.caderno.idCaderno, vm.distribuidoPor.tipo, vm.caderno.numeroTotalQuestoes, vm.indiceSalvo)
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

		function organizarIndice(indice) {
			carregarIndice(indice)
        	vm.organizadoPor = getOrganizacao(indice);
            vm.quantidadeSelecionados = 0;
		}

		function mostrarDistribuicaoPorIndice() {
			vm.alterarPreferenciaDistribuicao("INDICE");
			vm.distribuidoPor = getDistribuicao("INDICE");
		}

		function mostrarDistribuicaoPorQuantidade() {
			vm.alterarPreferenciaDistribuicao("QUANTIDADE");
			vm.distribuidoPor = getDistribuicao("QUANTIDADE");
		}

		function carregarPreferenciaDistribuicao() {
			factory.buscarPreferenciaDistribuicao()
				.then(function(distribuicao) {
					if (distribuicao == 'INDICE') {
						vm.distribuidoPor = getDistribuicao("INDICE");
					} else if (distribuicao == 'QUANTIDADE') {
						vm.distribuidoPor = getDistribuicao("QUANTIDADE");
					}
				});
		}

		function alterarPreferenciaDistribuicao(distribuicao) {
			factory.alterarPreferenciaDistribuicao(distribuicao);
		}

		function onEditarCaderno() {
			if (!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes()
			} else {
				vm.indiceEmEdicao = true;
			}
		}

		function mostrarAlertaExclusivoParaAssinantes() {
			tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
		}

		//private functions
		function carregarIndice(tipoOrganizacao) {
			var trocouIndice = vm.indiceSalvo != tipoOrganizacao;
			vm.indiceSalvo = tipoOrganizacao;
			factory.buscarIndice(vm.caderno.idCaderno, tipoOrganizacao)
				.then(function(data) {
					vm.assuntos = data;
					tratarAssuntos(tipoOrganizacao);
				})
				.then(function() {
					ocultarAssuntosFolha(vm.assuntos);
					vm.caderno.indiceSalvo = vm.indiceSalvo;
					factory.cacheAssuntos = vm.assuntos;
				})
				.then(function() {
					if (trocouIndice) {
						$scope.$parent.main.recarregarQuestao(vm.caderno.numeroQuestaoAtual);
					}
				});
		}
		function getDescricaoNumeroAnuladas() {
			var desc = "";
			var anuladas = vm.caderno.numeroAnuladas;
			if (anuladas > 0) {
				desc += "(";
				if (anuladas > 1) {
					desc += anuladas + " anuladas)";
				} else {
					desc += anuladas + " anulada)";
				}
			}
			return desc;
		}
		function getOrganizacao(tipo) {
			for (var i = 0; i < factory.tiposDeIndice.length; i++) {
				if (factory.tiposDeIndice[i].tipo == tipo) {
					vm.ordenadoPor = getDescricaoDaOrdem(factory.tiposDeIndice[i].ordem);
					return factory.tiposDeIndice[i];
				}
			}
		}
		function getDistribuicao(tipo) {
			var distribuicao = { tipo: '', descricao: '' };

			if (tipo == 'INDICE') {
				distribuicao.tipo = 'INDICE';
				distribuicao.descricao = 'Índice';
			} else if (tipo == 'QUANTIDADE') {
				distribuicao.tipo = 'QUANTIDADE';
				distribuicao.descricao = 'Quantidade';
			}
			return distribuicao;
		}
		function ocultarAssuntosFolha(assuntos) {
			$(assuntos).each(function(index, assunto) {
				assunto.ocultar = vm.temFilhos(assunto);
				if (vm.temFilhos(assunto)) {
					ocultarAssuntosFolha(assunto.subTree);
				}
			});
		}

		function tratarAssuntos(tipoOrganizacao) {
			$(vm.assuntos).each(function(index, assunto) {
				tratarAssunto(assunto, tipoOrganizacao, null);
			});

			function tratarAssunto(assunto, tipoOrganizacao, pai) {
				assunto.pai = pai;

				if (temFilhos(assunto)) {
					$(assunto.subTree).each(function(index, filho) {
						tratarAssunto(filho, tipoOrganizacao, assunto);
					});
				}

				if (vm.caderno.numeroTotalQuestoes) {
					var porcentagem = parseFloat(assunto.contagem) / parseFloat(vm.caderno.numeroTotalQuestoes) * 100;
					assunto.porcentagem = porcentagem.toFixed(2) + "%";
				}
			}
		}

		function onSelecionarTodos(checked) {
			$(vm.assuntos).each(function(index, assunto) {
				assunto.selecionado = checked;
				vm.onSelecaoAlterada(assunto, false);
			});
		}

		function tratarSelecaoTodos() {
			var temDeselecionado = false;

			for (var i = 0; i < vm.assuntos.length; i++) {
				var assunto = vm.assuntos[i];

				if (!assunto.selecionado) {
					temDeselecionado = true;
					break;
				}
			}

			vm.todosSelecionados = !temDeselecionado;
		}

		function onSelecaoAlterada(assunto, tratarPai) {		
			if (tratarPai == null) {
				tratarPai = true;
			}	
			if (temFilhos(assunto)) {
				for (var i = 0; i < assunto.subTree.length; i++) {
					var assuntoFilho = assunto.subTree[i];

					if (assuntoFilho.selecionado != assunto.selecionado) {
						assuntoFilho.selecionado = assunto.selecionado;
						onSelecaoAlterada(assuntoFilho, false);
					}
				}
			} else {
				if (assunto.selecionado) {
					vm.quantidadeSelecionados++;
				} else {
					vm.quantidadeSelecionados--;
				}
			}

			if (tratarPai && assunto.pai) {
				tratarSelecaoPai(assunto.pai);
			} else if (tratarPai) {
				tratarSelecaoTodos();
			}
		}

		function tratarSelecaoPai(pai) {
			var filhos = pai.subTree;

			var temDeselecionado = false;
			for (var i = 0; i < filhos.length; i++) {
				var filho = filhos[i];

				if (!filho.selecionado) {
					temDeselecionado = true;
					break;
				}
			}

			pai.selecionado = !temDeselecionado;

			if (pai.pai) {
				tratarSelecaoPai(pai.pai);
			} else {
				tratarSelecaoTodos();
			}
		}

		function ordenarPor(ordem) {
			factory.getTipoOrganizacaoAposTrocarOrdem(vm.organizadoPor.tipo, ordem)
			.then(function(data) {
				var indice = data.tipo;
				carregarIndice(indice)
	        	vm.organizadoPor = getOrganizacao(indice);
	            vm.quantidadeSelecionados = 0;
			})
		}
		
		function getDescricaoDaOrdem(ordem) {
			var descricao = "";
			if (ordem == 'CODIGO') {
				descricao = 'Código da questão';
			} else if (ordem == 'DATA') {
				descricao = 'Data';
			} else if (ordem == 'DIFICULDADE') {
				descricao = 'Dificuldade';
			} else if (ordem == 'PROVA') {
				descricao = 'Ordem da prova';
			}
			return descricao;
		}

		function onCancelarEdicao() {
			limparSelecao(vm.assuntos);
			vm.quantidadeSelecionados = 0;
			vm.indiceEmEdicao = false;
			vm.todosSelecionados = false;
		}

		function onFinalizarEdicao() {
			if (vm.quantidadeSelecionados <= 0) {
				vm.indiceEmEdicao = false;
				return;
			}

			var selecionados = listarSelecionados(vm.assuntos);

			var mensagem = "Remover deste caderno todas as questões do(s) seguinte(s) tópico(s): <ul style='margin-top:0.5rem;padding:1rem;list-style-type:disc;max-height:50vh;overflow-y:auto;'>";

			selecionados.forEach(function(assunto, index) {
				var nome;

				if ((vm.organizadoPor.tipo === 'CONCURSO' || vm.organizadoPor.tipo === 'BANCA') && assunto.pai) {
					nome = assunto.pai.nome + " - " + assunto.nome
				} else {
					nome = assunto.nome;
				}

				var quantidade = "(" + assunto.contagem + " " + (assunto.contagem == 1 ? "questão" : "questões") + ")";

				mensagem += "<li>" + nome + " <span style='color:#83828b;white-space:nowrap;'>" + quantidade + "</span></li>"
			});

			mensagem += "</ul>"

			tec.confirm(mensagem, "Remover questões do caderno", function(confirmou) {
				if (confirmou) {
					factory.removerQuestoesPeloIndice(vm.caderno.idCaderno, selecionados)
						.then(function(data) {
							//atualizar dados do cabecalho
							vm.caderno.numeroQuestaoAtual = data.caderno.numeroQuestaoAtual;
							vm.caderno.numeroTotalQuestoes = data.caderno.numeroTotalQuestoes;
							vm.caderno.finalizado = data.caderno.finalizado;

							vm.indiceEmEdicao = false;

							carregarIndice(vm.indiceSalvo);
							
							if(vm.caderno.finalizado) {
								factory.relogio.pause = true;
								factory.relogio.finalizado = true;
								factory.relogio.atualizarTempoFormatado();
							}
						});
				}
			});

			function listarSelecionados(assuntos) {
				var selecionados = [];

				$(assuntos).each(function(index, assunto) {
					if (assunto.selecionado) {
						selecionados.push(assunto);
					} else if (temFilhos(assunto)) {
						var filhosSelecionados = listarSelecionados(assunto.subTree);
						selecionados = selecionados.concat(filhosSelecionados);
					}
				});

				return selecionados;
			}
		}

		function limparSelecao(assuntos) {
			$(assuntos).each(function(index, assunto) {
				assunto.selecionado = false;
				if (temFilhos(assunto)) {
					limparSelecao(assunto.subTree);
				}
			});
		}

		// ALERTA PLANO AVANÇADO

		function mostrarAlertaPlanoAvancado() {
			tec.alert("Esta funcionalidade está disponível para assinantes do Plano Avançado. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
		}

	}
})();
