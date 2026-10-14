(function() {
 
var module = angular.module("tec.gerador");

module.directive("tecGeradorBuscadorMaterias", function(tec, tecDadosBuscadores, tecArvoreFunctions) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						titulo="Matérias e assuntos"
						busca="true"
						itens="vm.itens"
						filtros="vm.filtros"
						universo="vm.universo"
						on-abrir-pasta="vm.buscarAssuntos(pasta)"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter, $q) {
			var vm = this;
			vm.buscarAssuntos = buscarAssuntos;
			vm.buscarPorTexto = buscarPorTexto;
			
			ativar();
			
			function ativar() {

				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarMateriasPorTabelaTemporaria()
					.then(function(materias) {
						vm.materias = materias;
						vm.itens = materias;
					});
				} else {
					var assuntosPorMateria = (typeof jsonAssuntosPorMateria != 'undefined') ? jsonAssuntosPorMateria : null;
					$scope.$watchGroup(["vm.universo", "vm.formato"], function(newValues, oldValues) {
						var mudouUniverso = (oldValues[0].id) || (oldValues[0].id != newValues[0].id);
						var mudouFormato = oldValues[1].id != newValues[1].id;
						if ( !vm.materias || mudouUniverso || mudouFormato ) {
							tecDadosBuscadores.buscarMaterias(newValues[0], newValues[1])
							.then(function(materias) {
								vm.materias = materias;
								vm.itens = materias;

								//se for para carregar filtros do caderno base, precisa carregar os assuntos de cada materia;
								if (assuntosPorMateria) {
									tecDadosBuscadores.carregarAssuntosDeCadernoBase(vm.materias, assuntosPorMateria);
								}
							});
						}
					});
				}
			}
			
			function buscarAssuntos(materia) {
				if (!materia.subTree) {
					return tecDadosBuscadores.buscarAssuntos(vm.universo, vm.formato, materia)
					.then(function(assuntos) {
						materia.subTree = assuntos;
						tecArvoreFunctions.configurarSelecionarTudo(materia);
					});
				} else {
					$q.resolve(materia.subTree);
				}
			}
			
			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					if (vm.formato.id == 'DISCURSIVA') {
						var materias = $filter("filter")(vm.materias, { nome: texto }, tec.stringLikeForFilter);
                        atualizarListaBusca(materias, [], textoOriginal);
					} else {
						tecDadosBuscadores.buscarAssuntosPorNome(vm.universo, vm.formato, texto)
							.then(function(assuntos) {
								var materias = $filter("filter")(vm.materias, { nome: texto }, tec.stringLikeForFilter);

								angular.forEach(assuntos, function(assunto) {
									// Isso é feito para deixar a seta azul.
									assunto.indicarItemPai = assunto.descendentes.length > (assunto.id + ";").length;
								});

								atualizarListaBusca(materias, assuntos, textoOriginal);
							});
					}
				} else {
					vm.itens = vm.materias;
				}
			}

			function atualizarListaBusca(materias, assuntos, textoOriginal) {
				vm.itens = [];
				if (materias.length) {
					vm.itens.push({ nome: 'Matérias contendo "' + textoOriginal + '"', subTree: materias, temFilhos: true, pastaAberta: true });
				}

				if (assuntos.length) {
					vm.itens.push({ nome: 'Assuntos contendo "' + textoOriginal + '"', subTree: assuntos, temFilhos: true, pastaAberta: true });
				}

				if (!vm.itens.length) {
					vm.itens.push({ nome: 'Não há matérias ou assuntos contendo "' + textoOriginal + '".', bloqueado: true });
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorBancas", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						titulo="Bancas"
						busca="true"
						itens="vm.itens"
						filtros="vm.filtros"
						universo="vm.universo"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador" >
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			vm.buscarPorTexto = buscarPorTexto;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarBancasPorTabelaTemporaria()
					.then(function(bancas) {
						vm.bancas = bancas;
						vm.itens = bancas;
					});
				} else {
					$scope.$watchGroup(["vm.universo", "vm.formato"], function(values) {
						tecDadosBuscadores.buscarBancas(values[1], values[0])
						.then(function(bancas) {
							vm.bancas = bancas;
							vm.itens = bancas;
						});
					});
				}
			}
			
			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					vm.itens = $filter("filter")(vm.bancas, { nome: texto }, tec.stringLikeForFilter);
					if (!vm.itens.length) {
						vm.itens.push({ nome: 'Não há bancas contendo "' + textoOriginal + '".', bloqueado: true });
					}
				} else {
					vm.itens = vm.bancas;
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorOrgaos", function(tec, tecDadosBuscadores, tecArvoreFunctions) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						titulo="Órgãos e cargos"
						busca="true"
						itens="vm.itens"
						filtros="vm.filtros"
						universo="vm.universo"
						on-abrir-pasta="vm.buscarCargos(pasta)"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter, $q) {
			var vm = this;
			vm.buscarCargos = buscarCargos;
			vm.buscarPorTexto = buscarPorTexto;
			
			ativar();
			
			function ativar() {
				var cargosPorOrgao = (typeof jsonCargosPorOrgao != 'undefined') ? jsonCargosPorOrgao : null;

				if (vm.universo.id == 'PASTAS') {
						tecDadosBuscadores.buscarOrgaosPorTabelaTemporaria()
						.then(function(orgaos) {
							vm.orgaos = orgaos;
							vm.itens = orgaos;
						});
				} else {
					$scope.$watchGroup(["vm.universo", "vm.formato"], function(values) {
						tecDadosBuscadores.buscarOrgaos(values[0], values[1])
						.then(function(orgaos) {
							vm.orgaos = orgaos;
							vm.itens = orgaos;

							//se for para carregar filtros do caderno base, precisa carregar os cargos de cada orgão;
							if (cargosPorOrgao) {
								tecDadosBuscadores.carregarCargosDeCadernoBase(vm.orgaos, cargosPorOrgao);
							}
						});
					});
				}
			}
			
			function buscarCargos(orgao) {
				if (!orgao.subTree) {
					return tecDadosBuscadores.buscarCargos(vm.universo, vm.formato, orgao)
					.then(function(cargos) {
						orgao.subTree = cargos;
						tecArvoreFunctions.configurarSelecionarTudo(orgao);
					});
				} else {
					return $q.resolve(orgao.subTree);
				}
			}
			
			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					tecDadosBuscadores.buscarCargosPorNome(vm.universo, vm.formato, texto)
					.then(function(cargos) {
						var orgaos = $filter("filter")(vm.orgaos, { nome: texto }, tec.stringLikeForFilter);
						vm.itens = [];
						if (orgaos.length) {
							vm.itens.push({ nome: 'Órgãos contendo "' + textoOriginal + '"', subTree: orgaos, temFilhos: true, pastaAberta: true });
						}
						if (cargos.length) {
							vm.itens.push({ nome: 'Cargos contendo "' + textoOriginal + '"', subTree: cargos, temFilhos: true, pastaAberta: true });
						}
						if (!vm.itens.length) {
							vm.itens.push({ nome: 'Não há órgãos ou cargos contendo "' + textoOriginal + '".', bloqueado: true });
						}
					});
				} else {
					vm.itens = vm.orgaos;
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorAnos", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						titulo="Anos"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
						tecDadosBuscadores.buscarAnosPorTabelaTemporaria()
						.then(function(anos) {
							vm.itens = anos;
						});
				} else {
					$scope.$watchGroup(["vm.universo", "vm.formato"], function(values) {
						tecDadosBuscadores.buscarAnos(values[0], values[1])
						.then(function(anos) {
							vm.itens = anos;
						});
					});
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorAreas", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Áreas (Carreira)"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarAreasPorTabelaTemporaria()
					.then(function(areas) {
						vm.itens = areas;
					});
				} else {
					tecDadosBuscadores.buscarAreas()
					.then(function(areas) {
						vm.itens = areas;
					});
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorEscolaridades", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Escolaridade"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarEscolaridadesPorTabelaTemporaria()
					.then(function(escolaridades) {
						vm.itens = escolaridades;
					});
				} else {
					tecDadosBuscadores.buscarEscolaridades()
					.then(function(escolaridades) {
						vm.itens = escolaridades;
					});
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorProfissoes", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Formação"
						busca="true"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			vm.buscarPorTexto = buscarPorTexto;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarProfissoesPorTabelaTemporaria()
					.then(function(profissoes) {
						vm.itens = profissoes;
						vm.profissoes = profissoes;
					});
				} else {
					$scope.$watch("vm.formato", function(formato) {
						tecDadosBuscadores.buscarProfissoes(formato)
						.then(function(profissoes) {
							vm.itens = profissoes;
							vm.profissoes = profissoes;
						});
					});
				}
			}
			
			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					vm.itens = $filter("filter")(vm.profissoes, { nome: texto }, tec.stringLikeForFilter);
					if (!vm.itens.length) {
						vm.itens.push({ nome: 'Não há profissões contendo "' + textoOriginal + '".', bloqueado: true });
					}
				} else {
					vm.itens = vm.profissoes;
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorEsferas", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Regiões"
						busca="true"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			vm.buscarPorTexto = buscarPorTexto;

			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarEsferasPorTabelaTemporaria()
					.then(function(esferas) {
						vm.esferas = esferas;
						vm.itens = esferas;
					});
				} else {
					tecDadosBuscadores.buscarEsferas()
					.then(function(esferas) {
						vm.esferas = esferas;
						vm.itens = esferas;
					});
				}
			}

			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					vm.itens = filtrarArvore(texto, textoOriginal);
					if (!vm.itens.length) {
						vm.itens.push({ nome: 'Não há regiões contendo "' + textoOriginal + '".', bloqueado: true });
					}
				} else {
					vm.itens = vm.esferas;
				}
			}

			function filtrarArvore(texto, textoOriginal) {
				var resultado = [];

				for (var i = 0; i < vm.esferas.length; i++) {
					if (vm.esferas[i].id === "ESTADUAL") {
						var estados = $filter("filter")(vm.esferas[i].subTree, { nome: texto }, tec.stringLikeForFilter);

						if (estados.length){
							resultado.push({ nome: 'Estadual contendo "' + textoOriginal + '"', subTree: estados, temFilhos: true, pastaAberta: true });
						}
					} else if (vm.esferas[i].id === "MUNICIPAL") {
						var municipios = $filter("filter")(vm.esferas[i].subTree, { nome: texto }, tec.stringLikeForFilter);

						if (municipios.length){
							resultado.push({ nome: 'Municípal contendo "' + textoOriginal + '"', subTree: municipios, temFilhos: true, pastaAberta: true });
						}
					}
				}

				return resultado
			}
		}
	});
});

module.directive("tecGeradorBuscadorFavoritas", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Pastas de Questões Favoritas"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador">
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			
			ativar();
			
			function ativar() {
				if (vm.universo.id == 'PASTAS') {
					tecDadosBuscadores.buscarPastasQuestoesFavoritasPorTabelaTemporaria()
					.then(function(pastas) {
						vm.itens = pastas;
					});
				} else {
					tecDadosBuscadores.buscarPastasQuestoesFavoritas()
					.then(function(pastas) {
						vm.itens = pastas;
					});
				}
			}
		}
	});
});

module.directive("tecGeradorBuscadorQuestoes", function(tec, tecDadosBuscadores, tecDadosGeradorFiltros) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			filtrosAtalho: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Opções"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador"
						possui-grupos="true"
						>
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			ativar();
			
			function ativar() {
				/*tecDadosBuscadores.buscarFiltrosQuestao(formato)
				.then(function(filtros) {
					vm.itens = filtros;
				});*/
				
				$scope.$watchGroup(["vm.formato"], function(values) {
					var filtroRemoverAdaptadasIneditas;
					tecDadosBuscadores.buscarFiltrosQuestao(values[0], vm.universo)
					.then(function(filtros) {
						vm.itens = filtros;
						vm.filtrosAtalho.length = 0;

						angular.forEach(filtros, function(filtro) {
							if(filtro.id == "REMOVER_ADAPTADAS_INEDITAS") {
								filtroRemoverAdaptadasIneditas = filtro;
							} else if (!!vm.filtrosAtalho && (filtro.id == "REMOVER_ANULADAS" || filtro.id == "REMOVER_DESATUALIZADAS")) {
								filtro.esconderAtalho = false;
								vm.filtrosAtalho.push(filtro);
							}
						});

						if(filtroRemoverAdaptadasIneditas) {
							filtroRemoverAdaptadasIneditas.bloqueado = (vm.formato.id == "OBJETIVA_INEDITAS");
						}
					});
				});
			}
		}
	});
});

module.directive("tecGeradorBuscadorEnunciados", function(tec, tecDadosBuscadores) {
	return tec.defaultDirective({
		scope: {
			universo: "=",
			formato: "=",
			filtros: "=",
			render: "=",
			onFiltroAdicionado: "&",
			onFiltroRemovido: "&",
			resizeBuscador: "="
		},
		template: tec.multiline(function() {/**
			<div>
				<tec-gerador-buscador
						ng-if="vm.render"
						titulo="Enunciados"
						botao-buscar="true"
						placeholder="Digite o texto do enunciado procurado"
						maxlength="256"
						itens="vm.itens"
						filtros="vm.filtros"
						desativar-virtualizacao-lista="true"
						on-busca-texto="vm.buscarPorTexto(texto, textoOriginal)"
						on-filtro-adicionado="vm.onFiltroAdicionado({ filtro: filtro })"
						on-filtro-removido="vm.onFiltroRemovido({ filtro: filtro })"
						resize-buscador="vm.resizeBuscador" >
				</tec-gerador-buscador>
			</div>
		**/}),
		controller: function($scope, $filter) {
			var vm = this;
			vm.buscarPorTexto = buscarPorTexto;

			if (typeof jsonUsuario !== 'undefined') {
				var cookieName = "gerador.buscador.enunciado-" + jsonUsuario;
				ativar();
			}
			
			function ativar() {
				vm.itens = [];
				var historico = buscarHistoricoDeBuscasDeEnunciado();
				if (historico) {
					tecDadosBuscadores.buscarQuestoesPorEnunciado(historico.enunciado)
					.then(function(data) {
						if (data && data.length) {
							vm.itens.push(data[0]);								
						}											
					});
				}
			}

			function buscarPorTexto(texto, textoOriginal) {
				if (texto && texto.length) {
					if (vm.universo.id == 'PASTAS') {
						tecDadosBuscadores.buscarQuestoesPorEnunciadoNaTabelaTemporaria(texto)
						.then(function(data) {
							if (data && data.length) {
								angular.forEach(data, function(enunciado) {
									adicionaEnunciado(enunciado)
								});
								salvarEnunciadoNoCookie(texto);
							} else {
								adicionaEnunciado({ nome: 'Não há enunciados contendo "' + textoOriginal + '".', bloqueado: true });
							}
						});
					} else {
						tecDadosBuscadores.buscarQuestoesPorEnunciado(texto)
						.then(function(data) {
							if (data && data.length) {
								angular.forEach(data, function(enunciado) {
									adicionaEnunciado(enunciado)
								});
								salvarEnunciadoNoCookie(texto);
							} else {
								adicionaEnunciado({ nome: 'Não há enunciados contendo "' + textoOriginal + '".', bloqueado: true });
							}
						});
					}
				}
			}
			
			function salvarEnunciadoNoCookie(enunciado) {
				Cookies.set(cookieName, {enunciado: enunciado}, {expires: 7});
			}
			
			function buscarHistoricoDeBuscasDeEnunciado() {
				var cookie = Cookies.getJSON(cookieName);
				return cookie;
			}

			function adicionaEnunciado(enunciado) {
				for (i = vm.itens.length - 1; i >= 0; --i) {
					if (vm.itens[i].nome == enunciado.nome || vm.itens[i].bloqueado == true) {
						vm.itens.splice(i, 1);
					}
				}
				vm.itens.unshift(enunciado);
			}
		}
	});
});

module.service("tecDadosBuscadores", function(tec, tecArvoreFunctions) {
	var service = {
		buscarMaterias: buscarMaterias,
		buscarMateriasPorTabelaTemporaria: buscarMateriasPorTabelaTemporaria,
		buscarBancasPorTabelaTemporaria: buscarBancasPorTabelaTemporaria,
		buscarOrgaosPorTabelaTemporaria: buscarOrgaosPorTabelaTemporaria,
		buscarAssuntos: buscarAssuntos,
		buscarAssuntosPorNome: buscarAssuntosPorNome,
		buscarBancas: buscarBancas,
		buscarOrgaos: buscarOrgaos,
		buscarCargos: buscarCargos,
		buscarCargosPorNome: buscarCargosPorNome,
		buscarAnos: buscarAnos,
		buscarAnosPorTabelaTemporaria: buscarAnosPorTabelaTemporaria,
		buscarAreas: buscarAreas,
		buscarAreasPorTabelaTemporaria: buscarAreasPorTabelaTemporaria,
		buscarEscolaridades: buscarEscolaridades,
		buscarEscolaridadesPorTabelaTemporaria: buscarEscolaridadesPorTabelaTemporaria,
		buscarProfissoes: buscarProfissoes,
		buscarProfissoesPorTabelaTemporaria: buscarProfissoesPorTabelaTemporaria,
		buscarEsferas: buscarEsferas,
		buscarEsferasPorTabelaTemporaria: buscarEsferasPorTabelaTemporaria,
		buscarPastasQuestoesFavoritas: buscarPastasQuestoesFavoritas,
		buscarPastasQuestoesFavoritasPorTabelaTemporaria: buscarPastasQuestoesFavoritasPorTabelaTemporaria,
		buscarQuestoesPorEnunciado: buscarQuestoesPorEnunciado,
		buscarQuestoesPorEnunciadoNaTabelaTemporaria: buscarQuestoesPorEnunciadoNaTabelaTemporaria,
		buscarFiltrosQuestao: buscarFiltrosQuestao,
		carregamentoCompleto: carregamentoCompleto,
		carregamento: { 
			materia: false, assuntos: false, banca: false, orgao: false, ano: false, area: false,
			escolaridade: false, formacao: false, esfera: false, favoritas: false, opcoes: false
		},
		carregarFiltrosDoCadernoBase: carregarFiltrosDoCadernoBase,
		carregarAssuntosDeCadernoBase: carregarAssuntosDeCadernoBase,
		carregarCargosDeCadernoBase: carregarCargosDeCadernoBase,
		forcarCarregamentoDeOpcoesNaoListadas: forcarCarregamentoDeOpcoesNaoListadas,
		forcarRecarregar: forcarRecarregar,
	};
	
	return service;
	
	function forcarRecarregar(listaOpcoes) {
		var opcoes = service.carregamento;
		$.each(listaOpcoes, function(index, value) {
			opcoes[value] = false;
		})
	}
	function forcarCarregamentoDeOpcoesNaoListadas(listaOpcoes) {
		var opcoes = service.carregamento;
		$.each(listaOpcoes, function(index, value) {
			opcoes[value] = true;
		})
	}

	function carregamentoCompleto() {
		const carregamentoCompletoPromise = new Promise(function (resolve, reject) { 
			var intr = setInterval(function() {
				var tudoCarregado = service.carregamento.materia && service.carregamento.banca
				&& service.carregamento.orgao && service.carregamento.ano && service.carregamento.area 
				&& service.carregamento.escolaridade && service.carregamento.formacao && service.carregamento.esfera
				&& service.carregamento.favoritas && service.carregamento.opcoes;
				if (tudoCarregado) {
					clearInterval(intr);
					resolve(true);
				}
			}, 1000)
		});
		return carregamentoCompletoPromise;
	}

	function buscarMaterias(universo, formato) {
		return tec.apiGet("/materias", { universo: universo.id, formato: formato.id })
		.then(function(data) {
			if (formato.id.includes && formato.id.includes("OBJETIVA")) {
				tecArvoreFunctions.prepararItens(data.materias, {
					tipo: "MATERIA",
					tipoDescricao: "Matéria",
					postergarCarregamentoFilhos: true,
					incluirSelecionarTudo: true,
					title: function(item) {
						if (item.title == null) {
							return item.nome;
						} else {
							return item.title;
						}
					}
				});
			} else {
				tecArvoreFunctions.prepararItens(data.materias, {
					tipo: "MATERIA",
					tipoDescricao: "Matéria",
					title: function(item) {
						if (item.title == null) {
							return item.nome;
						} else {
							return item.title;
						}
					}
				});
			}
			service.materias = data.materias;
			service.carregamento.materia = true;
			return service.materias;
		});
	}

	function buscarMateriasPorTabelaTemporaria() {
		return tec.apiGet("/materias/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.materias, {
				tipo: "MATERIA",
				tipoDescricao: "Matéria",
				postergarCarregamentoFilhos: true,
				incluirSelecionarTudo: true,
				title: function(item) {
					if (item.title == null) {
						return item.nome;
					} else {
						return item.title;
					}
				}
			});
			service.materias = data.materias;
			service.carregamento.materia = true;
			return service.materias;
		});
	}

	function buscarAssuntos(universo, formato, materia) {
		return tec.apiGet("/assuntos", { universo: universo.id, formato: formato.id, materia: materia.id, hierarquico: true })
		.then(function(data) {
			service.assuntos = prepararSubItens(data.assuntos, "ASSUNTO", "Assunto");
			service.assuntos.push(criarAssuntoSemClassificacao(materia));
			return service.assuntos;
		});
	}
	
	function carregarAssuntosDeCadernoBase(materias, assuntosPorMateria) {
		angular.forEach(materias, function(materia) {
			//encontra a materia do filtro para inserir os assuntos
			var assuntos = assuntosPorMateria[materia.id];
			if (assuntos) {
				assuntos = prepararSubItens(assuntos, "ASSUNTO", "Assunto");
				assuntos.push(criarAssuntoSemClassificacao(materia));
				materia.subTree = assuntos;
				tecArvoreFunctions.configurarSelecionarTudo(materia);
			}
			materia.postergarCarregamentoFilhos = false;
		});
		service.materias = materias;
		service.carregamento.assuntos = true;
	}
	
	function carregarCargosDeCadernoBase(orgaos, cargosPorOrgao) {
		angular.forEach(orgaos, function(orgao) {
			//encontra o orgao do filtro para inserir os cargos
			var cargos = cargosPorOrgao[orgao.id];
			if (cargos) {
				cargos = prepararSubItensCargo(cargos);
				orgao.subTree = cargos;
				tecArvoreFunctions.configurarSelecionarTudo(orgao);
			}
			orgao.postergarCarregamentoFilhos = false;
		});
		service.orgaos = orgaos;
		service.carregamento.cargos = true;
	}
	
	function buscarAssuntosPorNome(universo, formato, nome) {
		return tec.apiGet("/assuntos", { universo: universo.id, formato: formato.id, nome: nome, hierarquico: false })
		.then(function(data) {
			return prepararSubItens(data.assuntos, "ASSUNTO", "Assunto");
		});
	}
	
	function buscarBancas(formato, universo) {
		return tec.apiGet("/bancas", { formato: formato.id, universo: universo.id })
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.bancas, {
				tipo: "BANCA",
				tipoDescricao: "Banca"
			});
			service.bancas = data.bancas;
			service.carregamento.banca = true;
			return data.bancas;
		});
	}

	function buscarBancasPorTabelaTemporaria() {
		return tec.apiGet("/bancas/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.bancas, {
				tipo: "BANCA",
				tipoDescricao: "Banca"
			});
			service.bancas = data.bancas;
			service.carregamento.banca = true;
			return data.bancas;
		});
	}

	function buscarOrgaos(universo, formato) {
		return tec.apiGet("/orgaos", { universo: universo.id, formato: formato.id })
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.orgaos, {
				tipo: "ORGAO",
				tipoDescricao: "Órgão",
				postergarCarregamentoFilhos: true,
				incluirSelecionarTudo: true,
				title: function(item) {
					if (item.title == null) {
						return item.sigla + " - " + item.nome;
					} else {
						return item.title;
					}
				}
			});

			angular.forEach(data.orgaos, function(orgao) {
				orgao.nome = orgao.sigla + " - " + orgao.nome;
			});
			service.orgaos = data.orgaos;
			service.carregamento.orgao = true;
			return data.orgaos;
		});
	}

	function buscarOrgaosPorTabelaTemporaria() {
		return tec.apiGet("/orgaos/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.orgaos, {
				tipo: "ORGAO",
				tipoDescricao: "Órgão",
				postergarCarregamentoFilhos: true,
				incluirSelecionarTudo: true,
				title: function(item) {
					if (item.title == null) {
						return item.sigla + " - " + item.nome;
					} else {
						return item.title;
					}
				}
			});
			
			angular.forEach(data.orgaos, function(orgao) {
				orgao.nome = orgao.sigla + " - " + orgao.nome;
			});
			service.orgaos = data.orgaos;
			service.carregamento.orgao = true;
			return data.orgaos;
		});
	}

	function buscarCargos(universo, formato, orgao) {
		return tec.apiGet("/cargos", { universo: universo.id, formato: formato.id, orgao: orgao.id, hierarquico: true })
		.then(function(data) {
			service.cargos = data.cargos;
			return prepararSubItensCargo(data.cargos);
		});
	}

	function buscarCargosPorNome(universo, formato, nome) {
		return tec.apiGet("/cargos", { universo: universo.id, formato: formato.id, nome: nome, hierarquico: true })
		.then(function(data) {
			return prepararSubItensCargo(data.cargos);
		});
	}	
	
	function buscarAnos(universo, formato) {
		return tec.apiGet("/anos", { universo: universo.id, formato: formato.id })
		.then(function(data) {
			var anos = [];
			angular.forEach(data.anos, function(ano) {
				anos.push({ id: ano, nome: ano });
			});
			tecArvoreFunctions.prepararItens(anos, {
				tipo: "ANO",
				tipoDescricao: "Ano",
			});
			service.anos = anos;
			service.carregamento.ano = true;
			return anos;
		});
	}

	function buscarAnosPorTabelaTemporaria() {
		return tec.apiGet("/anos/por-tabela-temporaria")
		.then(function(data) {
			var anos = [];
			angular.forEach(data.anos, function(ano) {
				anos.push({ id: ano, nome: ano });
			});
			tecArvoreFunctions.prepararItens(anos, {
				tipo: "ANO",
				tipoDescricao: "Ano",
			});
			service.anos = anos;
			service.carregamento.ano = true;
			return anos;
		});
	}

	function buscarAreas() {
		return tec.apiGet("/enums/areas")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.areas, {
				tipo: "AREA_CONCURSO",
				tipoDescricao: "Área do Concurso",
				postergarCarregamentoFilhos: false,
				incluirSelecionarTudo: true
			});
			service.areas = data.areas;
			service.carregamento.area = true;
			return data.areas;
		});
	}

	function buscarAreasPorTabelaTemporaria() {
		return tec.apiGet("/concursos/areas/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.areas, {
				tipo: "AREA_CONCURSO",
				tipoDescricao: "Área do Concurso",
				postergarCarregamentoFilhos: false,
				incluirSelecionarTudo: true
			});
			service.areas = data.areas;
			service.carregamento.area = true;
			return data.areas;
		});
	}

	function buscarEscolaridades() {
		return tec.apiGet("/enums/escolaridades")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.escolaridades, {
				tipo: "ESCOLARIDADE",
				tipoDescricao: "Escolaridade",
			});
			service.escolaridades = data.escolaridades;
			service.carregamento.escolaridade = true;
			return data.escolaridades;
		});
	}
	
	function buscarEscolaridadesPorTabelaTemporaria() {
		return tec.apiGet("/concursos/escolaridades/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.escolaridades, {
				tipo: "ESCOLARIDADE",
				tipoDescricao: "Escolaridade",
			});
			service.escolaridades = data.escolaridades;
			service.carregamento.escolaridade = true;
			return data.escolaridades;
		});
	}

	function buscarProfissoes(formato) {
		return tec.apiGet("/profissoes", { formato: formato.id })
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.profissoes, {
				tipo: "PROFISSAO",
				tipoDescricao: "Formação",
			});
			service.profissoes = data.profissoes;
			service.carregamento.formacao = true;
			return data.profissoes;
		});
	}

	function buscarProfissoesPorTabelaTemporaria() {
		return tec.apiGet("/profissoes/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.profissoes, {
				tipo: "PROFISSAO",
				tipoDescricao: "Formação",
			});
			service.profissoes = data.profissoes;
			service.carregamento.formacao = true;
			return data.profissoes;
		});
	}

	function buscarEsferas() {
		return tec.apiGet("/esferas", { excluirRegional: true, hierarquico: true })
		.then(function(data) {
			var esferas = data.esferas;
			tecArvoreFunctions.prepararItens(esferas, {
				tipo: function(item, pai) {
					if (pai == null) {
						return "ESFERA";
					} else if (pai.id == "ESTADUAL") {
						return "ESTADO_ENUM";
					} else if (pai.id == "MUNICIPAL") {
						return "CIDADE";
					}
				},
				incluirSelecionarTudo: true,
				tipoDescricao: function(item, pai) {
					if (pai == null) {
						return "Região";
					} else if (pai.id == "ESTADUAL") {
						return "Estado";
					} else if (pai.id == "MUNICIPAL") {
						return "Cidade";
					}
				}
			});
			service.esferas = data.esferas;
			service.carregamento.esfera = true;
			return esferas;
		});
	}

	function buscarEsferasPorTabelaTemporaria() {
		return tec.apiGet("/esferas/por-tabela-temporaria")
		.then(function(data) {
			var esferas = data.esferas;
			tecArvoreFunctions.prepararItens(esferas, {
				tipo: function(item, pai) {
					if (pai == null) {
						return "ESFERA";
					} else if (pai.id == "ESTADUAL") {
						return "ESTADO_ENUM";
					} else if (pai.id == "MUNICIPAL") {
						return "CIDADE";
					}
				},
				incluirSelecionarTudo: true,
				tipoDescricao: function(item, pai) {
					if (pai == null) {
						return "Região";
					} else if (pai.id == "ESTADUAL") {
						return "Estado";
					} else if (pai.id == "MUNICIPAL") {
						return "Cidade";
					}
				}
			});
			service.esferas = data.esferas;
			service.carregamento.esfera = true;
			return esferas;
		});
	}

	function buscarPastasQuestoesFavoritas() {
		return tec.apiGet("/pastas-favoritas")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.pastas, {
				tipo: "PASTA_FAVORITAS",
				tipoDescricao: "Favoritas"
			});
			service.pastaFavoritas = data.pastas;
			service.carregamento.favoritas = true;
			return data.pastas;
		});
	}
	
	function buscarPastasQuestoesFavoritasPorTabelaTemporaria() {
		return tec.apiGet("/pastas-favoritas/por-tabela-temporaria")
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.pastas, {
				tipo: "PASTA_FAVORITAS",
				tipoDescricao: "Favoritas"
			});
			service.pastaFavoritas = data.pastas;
			service.carregamento.favoritas = true;
			return data.pastas;
		});
	}

	function buscarFiltrosQuestao(formato, universo) {
		return tec.apiGet("/enums/filtros-questao", {formato: formato.id, universo: universo.id})
		.then(function(data) {
			tecArvoreFunctions.prepararItens(data.filtros, {
				tipo: "FILTRO_QUESTAO",
				tipoDescricao: "Opções"
			});
			data.filtros = ocultarFiltroSomenteAdaptadasIneditas(data.filtros);
			service.filtrosQuestao = data.filtros;
			service.carregamento.opcoes = true;
			return data.filtros;
		});
	}
	
	function buscarQuestoesPorEnunciado(enunciado) {
		return tec.apiPost("/questoes/enunciado", { enunciado: enunciado })
		.then(function(data) {
			var enunciados = [];
			if (data && data.boolean) {
				enunciados.push(
						{ 
							id: enunciado, 
							nome: enunciado, 
							tipo: "ENUNCIADO", 
							tipoDescricao: "Enunciado", 
							incluirSelecionarTudo: true, 
							title: "Enunciado: " + enunciado,
							bloqueado: false
						});
			}
			service.enunciados = enunciados;
			return enunciados;
		});
	}

	function  buscarQuestoesPorEnunciadoNaTabelaTemporaria(enunciado) {
		return tec.apiGet("/questoes/enunciado/por-tabela-temporaria", { enunciado: enunciado })
		.then(function(data) {
			var enunciados = [];
			if (data && data.boolean) {
				enunciados.push(
						{
							id: enunciado,
							nome: enunciado,
							tipo: "ENUNCIADO",
							tipoDescricao: "Enunciado",
							incluirSelecionarTudo: true,
							title: "Enunciado: " + enunciado,
							bloqueado: false
						});
			}
			service.enunciados = enunciados;
			return enunciados;
		});
	}

	//private functions

	function ocultarFiltroSomenteAdaptadasIneditas(filtrosQuestao) {
		angular.forEach(filtrosQuestao, function(filtro) {
			if (filtro.id == "SOMENTE_ADAPTADAS_INEDITAS") {
				filtro.hide = true
			}
		});
		return filtrosQuestao;
	}

	function prepararSubItens(itens, tipo, tipoDescricao) {
		tecArvoreFunctions.prepararItens(itens, {
			tipo: tipo,
			tipoDescricao: tipoDescricao,
			incluirSelecionarTudo: true,
			title: function(item) {
				if (item.tipo == 'ASSUNTO' && item.materia) {
					return item.materia.nome + ": " + item.nome;
				} else {
					return item.nome;
				}
			}
		});
		return itens;
	}
	
	function prepararSubItensCargo(itens) {
		return tecArvoreFunctions.prepararItens(itens, {
			tipo: function(item, pai) {
				if (item.tipo != null) {
					if (item.tipo == "Cargo" || item.tipo == "CARGO") {
						return "CARGO";
					} else if (item.tipo == "AreaCargo" || item.tipo == "AREA_CARGO") {
						return "AREA_CARGO";
					} else if (item.tipo == "Especialidade" || item.tipo == "ESPECIALIDADE"){
						return "ESPECIALIDADE";
					}
				} else if (pai == null) {
					return "CARGO";
				} else if (pai.tipo == "CARGO") {
					return "AREA_CARGO";
				} else if (pai.tipo == "AREA_CARGO") {
					return "ESPECIALIDADE";
				}
			},
			incluirSelecionarTudo: true,
			title: function(item) {
				if (item.title == null) {
					return item.nome;
				} else {
					return item.title;
				}
			},
			tipoDescricao: function(item, pai) {
				if (item.tipo != null) {
					if (item.tipo == "Cargo" || item.tipo == "CARGO") {
						return "Cargo";
					} else if (item.tipo == "AreaCargo" || item.tipo == "AREA_CARGO") {
						return "Área do Cargo";
					} else if (item.tipo == "Especialidade" || item.tipo == "ESPECIALIDADE"){
						return "Especialidade";
					}
				} else if (pai == null) {
					return "Cargo";
				} else if (pai.tipo == "CARGO") {
					return "Área do Cargo";
				} else if (pai.tipo == "AREA_CARGO") {
					return "Especialidade";
				}
			}
		});
	}
	
	function criarAssuntoSemClassificacao(materia) {
		var assuntoSemClassificacao = {
				nome: "Questões sem classificação de assunto",
				tipo: "SEM_CLASSIFICACAO_ASSUNTO",
				tipoDescricao: "Sem Classificação",
				id: materia.id,
				materia: materia.nome
			};
		return assuntoSemClassificacao;
	}

	function carregarFiltrosDoCadernoBase() {
		var filtrosCadernoBase = (typeof jsonFiltrosGeracao != 'undefined') ? jsonFiltrosGeracao : null;
		var filtros = {};
		
		//carregar filtros do caderno base
		if (filtrosCadernoBase) {
			var materiasSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('MATERIA', service.materias);
			if (materiasSelecionadas && materiasSelecionadas.length > 0) {
				filtros['MATERIA'] = materiasSelecionadas;
			}
			
			var bancasSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('BANCA', service.bancas);
			if (bancasSelecionadas && bancasSelecionadas.length > 0) {
				filtros['BANCA'] = bancasSelecionadas;
			}
			
			var orgaosSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('ORGAO', service.orgaos);
			if (orgaosSelecionadas && orgaosSelecionadas.length > 0) {
				filtros['ORGAO'] = orgaosSelecionadas;
			}

			var anosSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('ANO', service.anos);
			if (anosSelecionadas && anosSelecionadas.length > 0) {
				filtros['ANO'] = anosSelecionadas;
			}
			
			var areasDoCadernoBase = filtrosCadernoBase['AREA_CONCURSO'];
			if (areasDoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = areasDoCadernoBase.length; i < len; i++) {
				    lookup[areasDoCadernoBase[i].id] = areasDoCadernoBase[i];
				}
				var arr = [];
				angular.forEach(service.areas, function(area) {
					if (area.subTree) {
						var assuntosSelecionados = buscarFiltrosArvoreDoCadernoBase(lookup, area.subTree, []);
						arr = $.merge(assuntosSelecionados, arr);
					}
				});
				filtros['AREA_CONCURSO'] = arr;
				
				var areasRaizSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('AREA_CONCURSO', service.areas);
				if (areasRaizSelecionadas && areasRaizSelecionadas.length > 0) {
					$.merge(filtros['AREA_CONCURSO'], areasRaizSelecionadas);
				}
			}
			
			var escolaridadeSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('ESCOLARIDADE', service.escolaridades);
			if (escolaridadeSelecionadas && escolaridadeSelecionadas.length > 0) {
				filtros['ESCOLARIDADE'] = escolaridadeSelecionadas;
			}
			
			var profissoesSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('PROFISSAO', service.profissoes);
			if (profissoesSelecionadas && profissoesSelecionadas.length > 0) {
				filtros['PROFISSAO'] = profissoesSelecionadas;
			}
			
			var esferasSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('ESFERA', service.esferas);
			if (esferasSelecionadas && esferasSelecionadas.length > 0) {
				filtros['ESFERA'] = esferasSelecionadas;
			}
			
			var assuntosDoCadernoBase = filtrosCadernoBase['ASSUNTO'];
			if (assuntosDoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = assuntosDoCadernoBase.length; i < len; i++) {
				    lookup[assuntosDoCadernoBase[i].id] = assuntosDoCadernoBase[i];
				}
				var arr = [];
				angular.forEach(service.materias, function(materia) {
					if (materia.subTree) {
						var assuntosSelecionados = buscarFiltrosArvoreDoCadernoBase(lookup, materia.subTree, []);
						arr = $.merge(assuntosSelecionados, arr);
					}
				});
				filtros['ASSUNTO'] = arr;
			}
			
			var semClassificacaoCadernoBase = filtrosCadernoBase['SEM_CLASSIFICACAO_ASSUNTO'];
			if (semClassificacaoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = semClassificacaoCadernoBase.length; i < len; i++) {
				    lookup[semClassificacaoCadernoBase[i].id] = semClassificacaoCadernoBase[i];
				}
				var arr = [];
				angular.forEach(service.materias, function(materia) {
					var materiaDoAssunto = lookup[materia.id];
					if (materiaDoAssunto) {
						var filtroEncontrado = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('SEM_CLASSIFICACAO_ASSUNTO', materia.subTree);
						if (filtroEncontrado && filtroEncontrado.length > 0) {
							arr.push(filtroEncontrado[0]);
						}
					}
				});
				filtros['SEM_CLASSIFICACAO_ASSUNTO'] = arr;
			}


			var cargosDoCadernoBase = filtrosCadernoBase['CARGO'];
			if (cargosDoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = cargosDoCadernoBase.length; i < len; i++) {
				    lookup[cargosDoCadernoBase[i].id] = cargosDoCadernoBase[i];
				}
				var cargosSelecionadosMap = {};
				angular.forEach(service.orgaos, function(orgao) {
					if (orgao.subTree) {
						cargosSelecionadosMap = buscarFiltrosAbaOrgaoDoCadernoBase(lookup, orgao.subTree, cargosSelecionadosMap, cargosDoCadernoBase, "CARGO");
					}
				});
				filtros['CARGO'] = mapToArray(cargosSelecionadosMap);
			}
			
			var areasCargoDoCadernoBase = filtrosCadernoBase['AREA_CARGO'];
			if (areasCargoDoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = areasCargoDoCadernoBase.length; i < len; i++) {
				    lookup[areasCargoDoCadernoBase[i].id] = areasCargoDoCadernoBase[i];
				}
				var areasCargoSelecionadosMap = {};
				angular.forEach(service.orgaos, function(orgao) {
					if (orgao.subTree) {
						areasCargoSelecionadosMap = buscarFiltrosAbaOrgaoDoCadernoBase(lookup, orgao.subTree, areasCargoSelecionadosMap, cargosDoCadernoBase, 'AREA_CARGO');
					}
				});
				filtros['AREA_CARGO'] = mapToArray(areasCargoSelecionadosMap);
			}
			
			var especialidadeDoCadernoBase = filtrosCadernoBase['ESPECIALIDADE'];
			if (especialidadeDoCadernoBase) {
				var lookup = {};
				for (var i = 0, len = especialidadeDoCadernoBase.length; i < len; i++) {
					lookup[especialidadeDoCadernoBase[i].id] = especialidadeDoCadernoBase[i];
				}
				var especialidadesSelecionadasMap = {};
				angular.forEach(service.orgaos, function(orgao) {
					if (orgao.subTree) {
						especialidadesSelecionadasMap = buscarFiltrosAbaOrgaoDoCadernoBase(lookup, orgao.subTree, especialidadesSelecionadasMap, areasCargoDoCadernoBase, 'ESPECIALIDADE');
					}
				});
				filtros['ESPECIALIDADE'] = mapToArray(especialidadesSelecionadasMap);
			}
			
			var estadosCadernoBase = filtrosCadernoBase['ESTADO_ENUM'];
			if (estadosCadernoBase) {
				var lookup = {};
				for (var i = 0, len = estadosCadernoBase.length; i < len; i++) {
				    lookup[estadosCadernoBase[i].id] = estadosCadernoBase[i];
				}
				var arr = [];
				angular.forEach(service.esferas, function(esfera) {
					if (esfera.id === "ESTADUAL" && esfera.subTree) {
						var estadosSelecionados = buscarFiltrosArvoreDoCadernoBase(lookup, esfera.subTree, []);
						arr = $.merge(estadosSelecionados, arr);
					}
				});
				filtros['ESTADO_ENUM'] = arr;
			}
			
			var cidadesCadernoBase = filtrosCadernoBase['CIDADE'];
			if (cidadesCadernoBase) {
				var lookup = {};
				for (var i = 0, len = cidadesCadernoBase.length; i < len; i++) {
					lookup[cidadesCadernoBase[i].id] = cidadesCadernoBase[i];
				}
				var arr = [];
				angular.forEach(service.esferas, function(esfera) {
					if (esfera.id === "MUNICIPAL" && esfera.subTree) {
						var cidadesSelecionadas = buscarFiltrosArvoreDoCadernoBase(lookup, esfera.subTree, []);
						arr = $.merge(cidadesSelecionadas, arr);
					}
				});
				filtros['CIDADE'] = arr;
			}
			
			var favoritosSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('PASTA_FAVORITAS', service.pastaFavoritas);
			if (favoritosSelecionadas && favoritosSelecionadas.length > 0) {
				filtros['PASTA_FAVORITAS'] = favoritosSelecionadas;
			}
			
			var filtrosQuestaoSelecionadas = buscarFiltrosSimplesDoCadernoBaseNosItensCarregados('FILTRO_QUESTAO', service.filtrosQuestao);
			if (filtrosQuestaoSelecionadas && filtrosQuestaoSelecionadas.length > 0) {
				filtros['FILTRO_QUESTAO'] = filtrosQuestaoSelecionadas;
			}
			
			var enunciadosSelecionados = filtrosCadernoBase['ENUNCIADO'];
			if (enunciadosSelecionados) {
				var enunciados = [];				
				enunciadosSelecionados.forEach(function(enunciado) {			
					enunciados.push(
							{ 
								id: enunciado.id, 
								nome: enunciado.id.replace(/-/g, " "), 
								tipo: "ENUNCIADO", 
								tipoDescricao: "Enunciado", 
								incluirSelecionarTudo: true, 
								title: "Enunciado: " + enunciado.id.replace(/-/g, " ")
							});					
				});
				filtros['ENUNCIADO'] = enunciados;
			}
			
		}
		
		return filtros;
	}

	function buscarFiltrosSimplesDoCadernoBaseNosItensCarregados(tipo, itens) {
		var itensSelecionadas = buscarFiltrosDoCadernoBasePorTipo(tipo, itens);
		if (itensSelecionadas) {
			var arrayItens = []
			angular.forEach(itensSelecionadas, function(item) {
				arrayItens.push(item);
			});
			return arrayItens;
		}
		return ;
	}	
	
	function buscarFiltrosDoCadernoBasePorTipo(tipo, itens) {
		var filtrosCadernoBase = (typeof jsonFiltrosGeracao != 'undefined') ? jsonFiltrosGeracao : null;

		//Buscar todos filtros do tipoinformado
		var filtrosDoTipo = filtrosCadernoBase[tipo];

		var encontrados = [];
		if (filtrosDoTipo && filtrosDoTipo.length > 0) {
			angular.forEach(filtrosDoTipo, function(filtro) {
				for (i = 0; i < itens.length; i++) {
				    if (itens[i].id == filtro.id && itens[i].tipo == filtro.tipo) {
						encontrados.push(itens[i]);
				    	break;
				    }
				}
			});
		}
		
		return encontrados;
	}
	
	function buscarFiltrosArvoreDoCadernoBase(lookup, itens, arrayEncontrados) {
		var encontrados = arrayEncontrados;
		
		angular.forEach(itens, function(item) {
			if (item.subTree) {
				encontrados = buscarFiltrosArvoreDoCadernoBase(lookup, item.subTree, encontrados);
			}

			//encontra o item do filtro para inserir no array
			var filtro = lookup[item.id];
			if (filtro) {
				encontrados.push(item);
			}
			
		});
		
		return encontrados;
	}
	
	function buscarFiltrosAbaOrgaoDoCadernoBase(lookup, itens, encontradosMap, cargosDoCadernoBase, tipo) {
		var encontrados = encontradosMap;
		angular.forEach(itens, function(item) {
			if (item.subTree) {
				encontrados = buscarFiltrosAbaOrgaoDoCadernoBase(lookup, item.subTree, encontrados, cargosDoCadernoBase, tipo);
			}
			
			var filtro = lookup[item.id];
			if (filtro && item.tipo == tipo) {
				encontrados[item.id] = item;
			}
		});
		
		return encontrados;
	}
	
	function mapToArray(map) {
		var arr = [];
		for (var key in map) {
		    arr.push(map[key]);
		}
		return arr;
	}
	 
});

})();
