(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("TecCadernoConfiguracoesController", TecCadernoConfiguracoesController);

	TecCadernoConfiguracoesController.$inject = ["$scope", "$window", "tec", "tecDadosCaderno"];

	function TecCadernoConfiguracoesController($scope, $window, tec, factory) {
		var vm = this;

		// ATUALIZAÇÃO
		vm.dataAtualizacaoQuestao = null;
		vm.dataAtualizacaoResolucao = null;
		vm.verificandoAtualizacoes = false;
		vm.atualizacoes = null;
		vm.totalatualizacoes = 0;
		vm.atualizandoResolucoes = false;
		vm.quantidadeResolucoesImportadas = null;
		vm.atualizacaoAcimaLimite = false;

		vm.verificarAtualizacoes = verificarAtualizacoes;
		vm.atualizarQuestoes = atualizarQuestoes;
		vm.atualizarResolucoes = atualizarResolucoes;

		// FILTROS
		vm.assuntosSemQuestao = [];
		vm.filtros = [];
		vm.possuiFiltros = false;
		vm.possuiGrupoFiltrosSelecionado = false;

		vm.toggleSelecaoGrupoFiltro = toggleSelecaoGrupoFiltro;
		vm.toggleGrupoExpandido = toggleGrupoExpandido;
		vm.editarGrupoFiltro = editarGrupoFiltro;
		vm.copiarFiltrosGrupoFiltro = copiarFiltrosGrupoFiltro;
		vm.copiarFiltrosSelecionados = copiarFiltrosSelecionados;
		vm.copiarFiltrosDeAssuntos = copiarFiltrosDeAssuntos;
		vm.adicionarQuestoesPorCodigo = adicionarQuestoesPorCodigo;

		activate();

		function activate() {
			if (vm.caderno.dataUltimoAtualizacao) {
				vm.dataAtualizacaoQuestao = vm.caderno.dataUltimoAtualizacao;
			}

			if (vm.caderno.dataAtualizacaoResolucao) {
				vm.dataAtualizacaoResolucao = vm.caderno.dataAtualizacaoResolucao;
			}

			buscarDadosFiltro();
		}

		function buscarDadosFiltro() {
			if (factory.cacheFiltros && factory.cacheFiltros.assuntosSemQuestao && factory.cacheFiltros.grupos) {
				vm.assuntosSemQuestao = factory.cacheFiltros.assuntosSemQuestao;
                vm.filtros = factory.cacheFiltros.grupos;

                vm.possuiFiltros = vm.filtros && vm.filtros.length > 0;
			} else {
				buscarDadosFiltroSemCache();
			}
		}
		
		function buscarDadosFiltroSemCache() {
			factory.buscarDadosFiltros(vm.caderno.idCaderno)
				.then(function(data) {
					vm.assuntosSemQuestao = data.assuntosSemQuestao;
					vm.filtros = tratarGrupos(data.grupos);

					vm.possuiFiltros = vm.filtros && vm.filtros.length > 0;

					factory.cacheFiltros = {
						assuntosSemQuestao: vm.assuntosSemQuestao,
						grupos: vm.filtros
					};
				});
		}

		function verificarAtualizacoes() {
			vm.verificandoAtualizacoes = true;
			vm.opcaoAlterada = false;

			factory.verificarAtualizacoes(vm.caderno.idCaderno, typeof vm.grupoSelecionadoMenu === 'undefined' ? 0 : vm.grupoSelecionadoMenu.id)
				.then(function(data) {
					vm.atualizacoes = tratarAtualizacoes(data);

					vm.verificandoAtualizacoes = false;
				}).catch(function(erro) {
					if (erro.data && erro.data.error && erro.data.error.includes('limite')) {
						vm.atualizacaoAcimaLimite = true;
					}

					vm.verificandoAtualizacoes = false;
				});
		}

		function tratarAtualizacoes(dados) {
			var atualizacoes = [];
			var total = 0;

			dados.forEach(function(materia) {
				atualizacoes.push({
					nome: materia.nome,
					numeroQuestoes: materia.numeroQuestoes,
					tipo: materia.adicionar == true ? 'Adicionar' : 'Remover',
				});
				total += (materia.adicionar == true ? materia.numeroQuestoes : -materia.numeroQuestoes); 
			});

			switch (true) {
			    case (total < -1):
			        vm.totalatualizacoes = 'Total: ' + -total + ' questões removidas';
			        break;
			    case (total == -1):
			        vm.totalatualizacoes = 'Total: ' + ' 1 questão removida';
			        break;
			    case (total == 0):
			        vm.totalatualizacoes = 'Total: ' + ' 0 questão adicionada';
			        break;
			    case (total == 1):
			        vm.totalatualizacoes = 'Total: ' + ' 1 questão adicionada';
			        break;
			    case (total > 1):
			        vm.totalatualizacoes = 'Total: ' + total + ' questões adicionadas';
			        break;
			    default:
			        break;
			}

			return atualizacoes;
		}

		function atualizarQuestoes() {
			factory.atualizarQuestoes(vm.caderno.idCaderno, typeof vm.grupoSelecionadoMenu === 'undefined' ? 0 : vm.grupoSelecionadoMenu.id)
				.then(function(sucesso) {
					if (sucesso) {
						tec.alert('O caderno foi atualizado. Clique no botão abaixo para carregar as alterações.', 'Atualização concluída', function() {
							$window.location = contextPathUrl + "questoes/cadernos/" + vm.caderno.idCaderno + "?aba=configuracoes";
						});
					} else {
						tec.alert('Não foi possível atualizar o caderno, pois os filtros selecionados removeriam todas as questões do caderno.', 'Atualização não realizada');
					}
				});
		}

		function atualizarResolucoes() {
			tec.confirm("Esta alteração é permanente e afetará as resoluções neste caderno e seus gráficos de desempenho. Continuar?", "Atualização de resoluções", function(confirm) {
				if (!confirm) {
					return;
				}

				vm.atualizandoResolucoes = true;

				factory.atulizarResolucoes(vm.caderno.idCaderno)
					.then(function(data) {
						vm.quantidadeResolucoesImportadas = data.int;

						if (vm.quantidadeResolucoesImportadas > 0) {
							vm.dataAtualizacaoResolucao = dataAtualFormatada();
						}

						vm.atualizandoResolucoes = false;
					});
			});
		}

		function dataAtualFormatada(){
			var data = new Date();

			var dia = data.getDate();
			if (dia.toString().length == 1) {
				dia = "0" + dia;
			}

			var mes = data.getMonth() + 1;
			if (mes.toString().length == 1) {
				mes = "0" + mes;
			}

			var ano = data.getFullYear();

			return dia + "/" + mes + "/" + ano;
		}

		function tratarGrupos(grupos) {
			grupos.forEach(function (grupo) {
				grupo.selecionado = false;
				grupo.filtrosPorTipo = tratarFiltros(grupo.filtros);
				grupo.temFiltro = grupo.filtrosPorTipo && grupo.filtrosPorTipo.length > 0;
				grupo.expandido = !grupo.questoesAvulsas;
				grupo.mostrarOpcoes = grupo.temFiltro;
				
				if (grupo.id == -1) {
					// questões adicionadas por código
					vm.toggleGrupoExpandido(grupo);
					vm.possuiGrupoQuestoesAdicionadasPorCodigo = true;
				}
			});

			return grupos;
		}

		function tratarFiltros(filtros) {
			var filtrosPorTipo = {};

			filtros.forEach(function(filtro){
				if (!filtrosPorTipo[filtro.tipoFiltro]) {
					filtrosPorTipo[filtro.tipoFiltro] = [];
				}

				filtrosPorTipo[filtro.tipoFiltro].push(filtro);
			});

			var filtrosNovos = [];

			for (var tipo in filtrosPorTipo) {
				var filtro = {
					"tipo": tipo,
					"filtros": filtrosPorTipo[tipo]
				};

				filtrosNovos.push(filtro);
			}

			return filtrosNovos;
		}

		function toggleSelecaoGrupoFiltro(grupo, selecionar) {
			grupo.selecionado = selecionar;

			if (selecionar) {
				vm.possuiGrupoFiltrosSelecionado = true;
			} else {
				var achouSelecionado = false;

				for (var i = 0; i < vm.filtros.length; i++) {
					if (vm.filtros[i].selecionado) {
						achouSelecionado = true;
						break;
					}
				}

				vm.possuiGrupoFiltrosSelecionado = achouSelecionado;
			}
		}

		function toggleGrupoExpandido(grupo) {
			grupo.expandido = !grupo.expandido;

			if (grupo.temFiltro || !grupo.questoesAvulsas) {
				return;
			}

			factory.buscarQuestoesGrupoFiltro(vm.caderno.idCaderno, grupo.id)
				.then(function(data) {
					grupo.filtrosPorTipo = [
						{
							"tipo": "Questões Avulsas",
							"filtros": data
						}
					];
					grupo.temFiltro = true;
				});
		}

		function editarGrupoFiltro(grupo) {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			$window.location = contextPathUrl + "questoes/cadernos/" + vm.caderno.idCaderno + "/editar/" + (grupo.id ? grupo.id : "");
		}

		function copiarFiltrosGrupoFiltro(grupo) {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			var indice = grupo.id ? "&indiceGrupo=" + grupo.id : "";

			var url = contextPathUrl + "questoes/filtrar?cadernoBase=" + vm.caderno.idCaderno + "&idPasta=" + vm.idPasta + indice;

			window.open(url, '_blank');
		}

		function copiarFiltrosSelecionados() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			var param = "";

			vm.filtros.forEach(function(grupo) {
				if (grupo.selecionado && grupo.id) {
					param += "&indiceGrupo=" + grupo.id;
				}
			});

			$window.location = contextPathUrl + "questoes/filtrar?cadernoBase=" + vm.caderno.idCaderno + "&idPasta=" + vm.idPasta + param;
		}

		function copiarFiltrosDeAssuntos() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}

			$("#assuntosSemQuestaoForm").submit();
		}

		function mostrarAlertaExclusivoParaAssinantes() {
			tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
		}
		
		function adicionarQuestoesPorCodigo() {
			if(!$.isAssinanteLogado()) {
				mostrarAlertaExclusivoParaAssinantes();
				return;
			}	

			var idQuestoesValidas = [];
			if (vm.questoesAdicionarPorCodigo) {
				var idQuestoes = vm.questoesAdicionarPorCodigo.split(" ");
				
				for (var i = 0; i < idQuestoes.length; i++) {
					var idQuestao = idQuestoes[i];
										
					var reg = new RegExp('^\#?([0-9]+)$');
					if (reg.test(idQuestao)) {
						var idQuestaoNumeros = reg.exec(idQuestao)[1];
						idQuestoesValidas.push(idQuestaoNumeros);
					}
				}
			}

			factory.contarAdicionarQuestoesPorCodigo(vm.caderno.idCaderno, idQuestoesValidas)
			.then(function(result) {
				var contagem = result.contagem;

				var texto;

				if (contagem.passouLimite) {
					texto = "Limite de questões por caderno atingido.";
				} else if (contagem.numeroQuestoes == 0) {
					texto = 'Nenhuma questão será inserida em seu caderno. Verifique os códigos informados';
				} else if (contagem.numeroQuestoes == 1) {
					texto = '<b>' + contagem.numeroQuestoes + '</b> questão será inserida em seu caderno. Continuar?';										
				} else if (contagem.numeroQuestoes > 50) {
					texto = 'Limite máximo 50 questões por inclusão atingido.';					
				} else {
					texto = '<b>' + contagem.numeroQuestoes + '</b> questões serão inseridas em seu caderno. Continuar?';					
				}
				
				if (contagem.idQuestoesRepetidas.length == 1) {
					 texto += '<br /><br />'
						+ '<span style="color: red; font-weight: bold;">Atenção</span>: a questão ' + contagem.idQuestoesRepetidas + ' já consta neste caderno.';
				} else if (contagem.idQuestoesRepetidas.length > 1) {
					 texto += '<br /><br />'
						+ '<span style="color: red; font-weight: bold;">Atenção</span>: as questões ' + contagem.idQuestoesRepetidas + ' já constam neste caderno.';
				}
				
				$.alerts.confirm(texto,  'Adicionar questões por código', function(result) {
					if (result) {
						if (contagem.numeroQuestoes <= 50 && contagem.numeroQuestoes > 0) {
							factory.adicionarQuestoesPorCodigo(vm.caderno.idCaderno, idQuestoesValidas)
								.then(function() {
									buscarDadosFiltroSemCache();
									vm.questoesAdicionarPorCodigo = '';
									tec.alert('O caderno foi atualizado. Clique no botão abaixo para carregar as alterações.', 'Atualização concluída', function() {
										$window.location = contextPathUrl + "questoes/cadernos/" + vm.caderno.idCaderno + "?aba=configuracoes";
									});

								});							
						}
					}
				});
					
			});
		}
	}
})();
