(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.factory("tecDadosCaderno", tecDadosCaderno);

	tecDadosCaderno.$inject = ["$timeout","tec"];

	function tecDadosCaderno($timeout, tec) {
		var service = {
			// GERAL CADERNO

			relogio: {
				pausa: false,
				tempoFormatado: "",
				tempoInicio: null,
				tempoDecorridoSegundos: 0,
				finalizado: false,

				inicializar: function(tempoDecorrido, cadernoFinalizado) {
					this.pausa = false;
					this.tempoInicio = new Date();
					this.tempoDecorridoSegundos = Math.abs(tempoDecorrido);
					this.finalizado = cadernoFinalizado;

					atualizarRelogio();
				},

				atualizarTempoFormatado: function() {
					var tempoDecorridoSegundos = (new Date().getTime() - this.tempoInicio.getTime()) / 1000 + this.tempoDecorridoSegundos;
					var horas = doisDigitos(tempoDecorridoSegundos / 3600);
					var minutos = doisDigitos((tempoDecorridoSegundos % 3600) / 60);
					var segundos = doisDigitos(tempoDecorridoSegundos % 60);

					this.tempoFormatado = horas + ":" + minutos + ":" + segundos;

					function doisDigitos(valor) {
						valor = parseInt(valor);
						return valor < 10 ? "0" + valor : valor;
					}
				}
			},

			buscaFavoritasDoCaderno: buscaFavoritasDoCaderno,
			buscaAnotadasDoCaderno: buscaAnotadasDoCaderno,
			carregarConfiguracoesDoAluno: carregarConfiguracoesDoAluno,
			pausarResolucao: pausarResolucao,
			despausarResolucao: despausarResolucao,
			compartilharCaderno: compartilharCaderno,
			removerQuestaoAtual: removerQuestaoAtual,
			realizarDownloadCaderno: realizarDownloadCaderno,

			// INDICE

			cacheAssuntos: [],
			buscarIndice: buscarIndice,
			alterarQuestaoAtual: alterarQuestaoAtual,
			removerQuestoesPeloIndice: removerQuestoesPeloIndice,
			finalizarCaderno: finalizarCaderno,
			downloadIndiceCaderno: downloadIndiceCaderno,
			arrayParaJsonExcell: arrayParaJsonExcell,
			arrayParaJsonLoop: arrayParaJsonLoop,
			indiceCadernoJson: "",
			tiposDeIndice: [],
			carregarTiposDeIndice: carregarTiposDeIndice,
			getTipoOrganizacaoAposTrocarOrdem: getTipoOrganizacaoAposTrocarOrdem,

			// ESTATISTICAS

			pastas: [],

			buscarResumoCaderno: buscarResumoCaderno,
			buscarDesempenhoCaderno: buscarDesempenhoCaderno,
			buscarMateriasCaderno: buscarMateriasCaderno,
			duplicarCaderno: duplicarCaderno,
			gerarCadernoQuestoesResolvidas: gerarCadernoQuestoesResolvidas,
			gerarCadernoQuestoesResolvidasComFiltro: gerarCadernoQuestoesResolvidasComFiltro,
			gerarCadernoQuestoesCertas: gerarCadernoQuestoesCertas,
			gerarCadernoQuestoesErradas: gerarCadernoQuestoesErradas,
			gerarCadernoQuestoesErradasComFiltro: gerarCadernoQuestoesErradasComFiltro,
			gerarCadernoQuestoesEmBranco: gerarCadernoQuestoesEmBranco,
			gerarCadernoQuestoesFavoritas: gerarCadernoQuestoesFavoritas,
			gerarCadernoQuestoesAnotadas: gerarCadernoQuestoesAnotadas,
			zerarResolucoes: zerarResolucoes,
			zerarResolucoesCertas: zerarResolucoesCertas,
			zerarResolucoesErradas: zerarResolucoesErradas,
			zerarResolucoesFavoritas: zerarResolucoesFavoritas,
			zerarResolucoesAnotadas: zerarResolucoesAnotadas,
			zerarCronometro: zerarCronometro,
			buscarPorcentagemTeoriaLida: buscarPorcentagemTeoriaLida,
			alterarCapituloLido: alterarCapituloLido,
			buscarPreferenciaDistribuicao: buscarPreferenciaDistribuicao,
			alterarPreferenciaDistribuicao: alterarPreferenciaDistribuicao,
			listarPastas: listarPastas,
			buscarDesempenhoDemaisUsuarios: buscarDesempenhoDemaisUsuarios,

			// GABARITO

			buscarDadosGabarito: buscarDadosGabarito,
			resolverQuestoesGabarito: resolverQuestoesGabarito,

			// CONFIGURACOES

			buscarDadosFiltros: buscarDadosFiltros,
			buscarQuestoesGrupoFiltro: buscarQuestoesGrupoFiltro,
			verificarAtualizacoes: verificarAtualizacoes,
            atualizarQuestoes: atualizarQuestoes,
            atulizarResolucoes: atulizarResolucoes,
            
            // cadernos
            listarItensSubpasta: listarItensSubpasta,
            
            adicionarQuestoesPorCodigo: adicionarQuestoesPorCodigo,
            contarAdicionarQuestoesPorCodigo: contarAdicionarQuestoesPorCodigo
		};

		ativar();

		return service;

		function ativar() {
			service.carregarConfiguracoesDoAluno();
		}

		function buscaFavoritasDoCaderno(idCaderno) {
			if (tec.isLogado()) {
				return tec.apiPut("/cadernos/" + idCaderno + "/questoes-favoritas-caderno");
			} else {
				return null;
			}
		}

		function buscaAnotadasDoCaderno(idCaderno) {
			if (tec.isLogado()) {
				return tec.apiPut("/cadernos/" + idCaderno + "/questoes-anotadas-caderno");
			} else {
				return null;
			}
		}

		function carregarConfiguracoesDoAluno() {
			return $.obterValorConfiguracaoUsuario("mostrarAcertosEErros")
				.then(function(mostrarAcertosEErros) {
					service.mostrarAcertosEErros = mostrarAcertosEErros;
				})
				.catch(function(){});
		}

		function atualizarRelogio() {
			if (!service.relogio.pausa || service.relogio.finalizado) {
				service.relogio.atualizarTempoFormatado();

				if (!service.relogio.finalizado) {
					$timeout(atualizarRelogio, 1000);
				}
			}
		}

		function pausarResolucao(idCaderno) {
			tec.apiPut("/cadernos/" + idCaderno + "/pausar-resolucao");
		}

		function despausarResolucao(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/despausar-resolucao")
				.then(function(data) {
					var tempoDecorrido = parseInt(data.long);
					service.relogio.inicializar(tempoDecorrido, service.relogio.finalizado);
				});
		}

		function compartilharCaderno(idCaderno) {
			return tec.apiPost("/cadernos/" + idCaderno + "/compartilhamento");
		}
		
		function realizarDownloadCaderno(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/download");
		}

		function removerQuestaoAtual(idCaderno) {
			return tec.apiDelete("/cadernos/" + idCaderno + "/questoes/remover-questao-atual");
		}

		function buscarIndice(idCaderno, ordem) {
			return tec.apiGet("/cadernos/" + idCaderno + "/carregar-indice", { orderBy: ordem });
		}

		function alterarQuestaoAtual(idCaderno, numeroQuestao) {
			return tec.apiPut("/cadernos/" + idCaderno + "/questao-atual", { numeroQuestaoAtual: numeroQuestao });
		}

		function removerQuestoesPeloIndice(idCaderno, items) {
			var body = {};

			for (var i = 0; i < items.length; i++) {
				var item = items[i];

				body["indice[" + i + "].id"] = item.id;
				body["indice[" + i + "].tipo"] = item.tipo;
				body["indice[" + i + "].indice"] = item.indice;
				body["indice[" + i + "].contagem"] = item.contagem;
			}

			return tec.apiDelete("/cadernos/" + idCaderno + "/questoes/remover-indice", body);
		}

		function finalizarCaderno(caderno) {
			if(caderno.finalizado || caderno.numeroEmBranco > 0) {
				return;
			}

			caderno.finalizado = true;
            service.relogioParado = true;
            service.relogio.finalizado = true;

			return tec.apiPut("/cadernos/" + caderno.idCaderno + "/finalizar")
				.then(function(data) {
					service.relogio.tempoInicio = new Date();
					service.relogio.tempoDecorridoSegundos = Math.abs(data.caderno.tempoTotalCronometroSegundos);
					service.relogio.atualizarTempoFormatado();
				});
		}

		function downloadIndiceCaderno(caderno, distribuidoPor, totalQuestoes, ordem) {
			var parametros = {};
			parametros["caderno"] = caderno;
			parametros["orderBy"] = ordem;
			parametros["distribuidoPor"] = distribuidoPor;
			parametros["totalQuestoes"] = totalQuestoes;
			return tec.apiPost("/cadernos/indice/download", parametros);
		}

		function buscarResumoCaderno(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/resumo", { atualizarCronometro: !service.relogio.pausa });
		}

		function buscarDesempenhoCaderno(idCaderno, idMateria) {
			return tec.apiGet("/cadernos/" + idCaderno + "/dados-desempenho-caderno", { idMateria: idMateria });
		}

		function buscarMateriasCaderno(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/materias-caderno-estatistica", {});
		}

		function buscarDesempenhoDemaisUsuarios(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/desempenho-demais-usuarios", {});
		}

		function duplicarCaderno(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/duplicar-caderno", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesResolvidas(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-resolvidas"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-resolvidas", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesResolvidasComFiltro(idCaderno, opcoes, filtros) {
			var body = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-resolvidas-filtro"
			};

			for (var i = 0; i < filtros.length; i++) {
				var filtro = filtros[i];

				body["filtros[" + i + "].tipo"] = filtro.tipo;
				body["filtros[" + i + "].id"] = filtro.id;
			}

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-resolvidas", body)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesCertas(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-acertos"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-acertos", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesErradas(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-erros"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-erros", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesErradasComFiltro(idCaderno, opcoes, filtros) {
			var body = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-erros-filtro"
			};

			for (var i = 0; i < filtros.length; i++) {
				var filtro = filtros[i];

				body["filtros[" + i + "].tipo"] = filtro.tipo;
				body["filtros[" + i + "].id"] = filtro.id;
			}

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-erros", body)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesEmBranco(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-branco"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-branco", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesFavoritas(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-favoritas"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-favoritas", params)
				.then(function(dados) {
					return dados;
				});
		}

		function gerarCadernoQuestoesAnotadas(idCaderno, opcoes) {
			var params = {
				nome: opcoes.nome,
				pastaDestino: opcoes.pasta,
				subpastaDestino: opcoes.subpasta,
				requestId: "gerar-caderno-anotadas"
			};

			return tec.apiPost("/cadernos/" + idCaderno + "/gerar-caderno-anotadas", params)
				.then(function(dados) {
					return dados;
				});
		}
		
		function buscarPreferenciaDistribuicao() {
			return $.obterValorConfiguracaoUsuario("exibicaoDistribuicaoCadernoEnum")
					.catch(function() {
						return "INDICE";
					});
		}
		
		function alterarPreferenciaDistribuicao(distribuicao) {
			tec.apiPut("/alunos/aluno-logado/alterar-modo-exibicao-distribuicao", { modoExibicaoDistribuicao: distribuicao })
				.then(function(){
					$.atualizarConfiguracaoUsuarioLocalStorage("exibicaoDistribuicaoCadernoEnum", distribuicao);
				});
		}

		function zerarResolucoes(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/apagar-resolucoes");
		}

		function zerarResolucoesCertas(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/apagar-resolucoes-certas");
		}

		function zerarResolucoesErradas(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/apagar-resolucoes-erradas");
		}
		
		function zerarResolucoesFavoritas(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/apagar-resolucoes-favoritas");
		}

		function zerarResolucoesAnotadas(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/apagar-resolucoes-anotadas");
		}

		function zerarCronometro(idCaderno) {
			return tec.apiPut("/cadernos/" + idCaderno + "/zerar-cronometro");
		}

		function buscarPorcentagemTeoriaLida(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/porcentagem-teoria-lida")
				.then(function(dados) {
					return dados.int;
				});
		}

		function alterarCapituloLido(idCapitulo, lido) {
			return tec.apiPut("/teoria/capitulo/" + idCapitulo + "/lido", { lido: lido });
		}

		function buscarDadosFiltros(idCaderno) {
			return tec.apiGet("/cadernos/" + idCaderno + "/configuracoes/filtros");
		}

		function buscarQuestoesGrupoFiltro(idCaderno, idGrupo) {
			return tec.apiGet("/cadernos/" + idCaderno + "/configuracoes/filtros/" + idGrupo + "/questoes");
		}

		function verificarAtualizacoes(idCaderno, grupo) {
			return tec.apiGet("/cadernos/" + idCaderno + "/configuracoes/atualizacoes/" + grupo);
		}

		function atualizarQuestoes(idCaderno, grupo) {
			return tec.apiPost("/cadernos/" + idCaderno + "/configuracoes/atualizar/" + grupo);
		}

		function atulizarResolucoes(idCaderno) {
			return tec.apiPost("/cadernos/" + idCaderno + "/configuracoes/importar-resolucoes");
		}

		function buscarDadosGabarito(idCaderno, parametros) {
			return tec.apiGet("/cadernos/" + idCaderno + "/gabarito", parametros);
		}

		function resolverQuestoesGabarito(idCaderno, questoes) {
			var body = {};

			for (var i = 0; i < questoes.length; i++) {
				var questao = questoes[i];

				body["questoes[" + i + "].posicaoCaderno"] = questao.posicaoCaderno;
				body["questoes[" + i + "].idQuestao"] = questao.idQuestao;
				body["questoes[" + i + "].alternativa"] = questao.alternativa;
			}

			return tec.apiPost("/cadernos/" + idCaderno + "/gabarito/resolver", body);
		}


		function arrayParaJsonExcell(array) {
			arrayParaJsonLoop(array, 0, "");
			return eval('({' + service.indiceCadernoJson + '})');
		}

		function arrayParaJsonLoop(array, contador, nivel) {
			$.each(array, function(index, obj) {
				service.indiceCadernoJson += "'dtos[" + contador + "].ordenacao' : '" + contador + "',";
				service.indiceCadernoJson += "'dtos[" + contador + "].indice' : '" + obj.indice + "',";
				service.indiceCadernoJson += "'dtos[" + contador + "].nome' : '" + nivel + obj.nome.replace("'", "\\'") + "',";
				service.indiceCadernoJson += "'dtos[" + contador + "].contagem' : '" + obj.contagem + "',";
				service.indiceCadernoJson += "'dtos[" + contador + "].porcentagem' : '" + obj.porcentagem + "',";

				contador += 1;
				if(obj.subTree instanceof Object) {
					contador = arrayParaJsonLoop(obj.subTree, contador, nivel + "  ");
				}
			});
			return contador;
		}

		function listarPastas() {
			return tec.apiGet("/pastas-cadernos/", { buscarSubpastas: true });
		}
		function carregarTiposDeIndice() {
			return tec.apiGet("/enums/indices-caderno");
		}
		function getTipoOrganizacaoAposTrocarOrdem(organizacao, ordem) {
			var params = {
				tipoIndiceAtual: organizacao, 
				novaOrdenacao: ordem
			}
			return tec.apiGet("/cadernos/obter-tipo-organizacao", params);
		}
		
		
		function listarItensSubpasta(idPasta, idSubpasta, ordenacao) {
			ordenacao = ordenacao || "nome";
			
			var respostaFunc = function(data) {
					data = data || {};
					
					if (service.mapCadernos) {
						$(data.itens).each(function(_, item) {
							item.objetivas = item.formatoQuestoes == "OBJETIVA";
							var progresso = service.mapCadernos.get(item.id);
		
							if (progresso) {
								item.numeroTotalQuestoes = progresso.numeroTotalQuestoes;
								item.numeroQuestoesResolvidas = progresso.numeroQuestoesResolvidas;
								item.porcentagemAcertos = progresso.porcentagemAcertos;
								item.porcentagemErros = progresso.porcentagemErros;
		
								item.porcentagemAcertosResolvidas = progresso.numeroQuestoesResolvidas == 0 ? 0 : (100 * (progresso.numeroAcertos / progresso.numeroQuestoesResolvidas)).toFixed(2);
		                        item.porcentagemErrosResolvidas = progresso.numeroQuestoesResolvidas == 0 ? 0 : (100 * (progresso.numeroErros / progresso.numeroQuestoesResolvidas)).toFixed(2);
							}
						});						
					}	
	
					return data.itens;
				}
			
			if (idSubpasta) {
				return tec.apiGet("/pastas-cadernos/" + idPasta + "/subpastas/" + idSubpasta + "/itens", { ordenacao: ordenacao })
					.then(respostaFunc);
			} else {
				return tec.apiGet("/pastas-cadernos/" + idPasta + "/subpastas/itens", { ordenacao: ordenacao, naoIncluirCadernosSubpasta: true })
					.then(respostaFunc);				
			}
	
		}
		
		function contarAdicionarQuestoesPorCodigo(idCaderno, idQuestoes) {
			var body = {};
			
			for (var i = 0; i < idQuestoes.length; i++) {
				var idQuestao = idQuestoes[i];
				
				body["idQuestoes[" + i + "]"] = idQuestao;
			}
			
			return tec.apiPost("/cadernos/" + idCaderno + "/questoes/contar-adicionar-questoes-por-codigo", body)
		}
		
		function adicionarQuestoesPorCodigo(idCaderno, idQuestoes) {
			var body = {};
			
			for (var i = 0; i < idQuestoes.length; i++) {
				var idQuestao = idQuestoes[i];
				
				body["idQuestoes[" + i + "]"] = idQuestao;
			}
			
			return tec.apiPost("/cadernos/" + idCaderno + "/questoes/adicionar-questoes-por-codigo", body)
		}

	}
})();
