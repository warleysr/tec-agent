(function() {

var module = angular.module("tec.questoes");

module.controller("CadernosQuestoesCtrl", function($route, $scope, $timeout, tecDadosCadernos, tec) {
	var vm = this;
	vm.pasta = tecDadosCadernos.pasta;
	vm.pastas = tecDadosCadernos.pastas;
	vm.itens = tecDadosCadernos.cadernos;
	vm.totalQuestoesSelecionadas = 0;
	vm.limiteQuestoesAtingido = false;
	vm.ordenacao = (jsonPreferencias.ordenacaoCadernos || "nome").toLowerCase();

	vm.listarCadernos = listarCadernos;
	vm.listarPastas = listarPastas;
	vm.recarregarPasta = recarregarPasta;
	vm.renomearPasta = renomearPasta;
	vm.ordenar = ordenar;
	vm.ativarExcluirCadernos = ativarExcluirCadernos;
	vm.ativarMoverCadernos = ativarMoverCadernos;
	vm.ativarCriarCaderno = ativarCriarCaderno;
	vm.ativarUnirCadernos = ativarUnirCadernos;
	vm.ativarExportarCadernos = ativarExportarCadernos;
	vm.excluirItens = excluirItens;
	vm.moverItens = moverItens;
	vm.cancelarOperacaoPasta = cancelarOperacaoPasta;
	vm.excluirPasta = excluirPasta;
	vm.selecionarLinha = selecionarLinha;
	vm.selecionarTudo = selecionarTudo;
	vm.possuiItensSelecionados = possuiItensSelecionados;
	vm.tratarSelecionar = tratarSelecionar;
	vm.renomearItem = renomearItem;
	vm.criarAtalhoItem = criarAtalhoItem;
	vm.removerAtalhoItem = removerAtalhoItem;
	vm.excluirItem = excluirItem;
	vm.compartilharCaderno = compartilharCaderno;
	vm.imprimirCaderno = imprimirCaderno;
	vm.usuarioNaoAssinante = usuarioNaoAssinante;
	vm.unirCadernos = unirCadernos;
	vm.exportarCadernos = exportarCadernos;
	vm.processandoUnirCadernos = false;
	vm.carregarMaisCadernos = carregarMaisCadernos;
	vm.carregarProgresso = carregarProgresso;
	vm.carregarProgressoPasta = carregarProgressoPasta;
	vm.lineClick = lineClick;
	vm.dados = tecDadosCadernos;
	vm.temCadernoUnidoLegado = false;
	vm.desabilitarBotaoApagarPasta = desabilitarBotaoApagarPasta;
	vm.fecharModalConfirmarExclusaoPasta = fecharModalConfirmarExclusaoPasta;
	vm.excluirPastaConfirmado = excluirPastaConfirmado;
	vm.criarSubpasta = criarSubpasta;
	vm.toggleSubpastaExpandida = toggleSubpastaExpandida;
	vm.mostrarAlertaPlanoAvancado = mostrarAlertaPlanoAvancado;
	vm.alterarVisualizacaoParaCurso = alterarVisualizacaoParaCurso;
	vm.dialogoUnirCadernoSelecionarPasta = dialogoUnirCadernoSelecionarPasta;
	vm.progressoSomenteResolvidas = true;
	vm.proximaEtapaCriarCaderno = proximaEtapaCriarCaderno;
	vm.finalizarCriarCaderno = finalizarCriarCaderno;
	vm.cancelarCriarCaderno = cancelarCriarCaderno;
	vm.isAssinante = $.isAssinanteLogado();

	iniciar();
	
	function iniciar() {
		if (!alertify.unirCadernoAlert) {
			criarDialogoUnirCaderno();
		}
		var jsonParams = $route.current.params;
		var idPasta = jsonParams.id;
		buscarPasta(idPasta)
		
		if (vm.itens.length == 0) {
			listarCadernos(idPasta);
		}
		listarPastas();
		vm.pagina = 1;

		if (localStorage.getItem("tec.progressoSomenteResolvidas" + "["+userId+"]") != null) {
			vm.progressoSomenteResolvidas = JSON.parse(localStorage.getItem("tec.progressoSomenteResolvidas" + "["+userId+"]"));
		}
		$scope.$watch("vm.progressoSomenteResolvidas", function() {
			localStorage.setItem("tec.progressoSomenteResolvidas" + "["+userId+"]", JSON.stringify(vm.progressoSomenteResolvidas))
		});
	}
	
	function usuarioNaoAssinante() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}

	function buscarPasta(idPasta){
		tecDadosCadernos.buscarPasta(idPasta)
		.then(function(data) {
			tecDadosCadernos.pasta = data.pasta;
			vm.pasta = tecDadosCadernos.pasta;
		});
	}

	function listarCadernos(idPasta, subpastasParaRecarregar) {
		vm.pagina = 1;
		var ordenarPor = vm.reordenarPor || vm.ordenacao;

		tecDadosCadernos.listarItens(idPasta, ordenarPor, vm.pagina, subpastasParaRecarregar)
			.then(function() {
				vm.itens = [];
				vm.itens = tecDadosCadernos.itens;
				vm.tudoSelecionado = false;
				vm.modoSelecao = false;
				vm.movendoItens = false;
				vm.excluindoItens = false;
				vm.unindoItens = false;
				vm.exportandoItens = false;
				vm.criandoCaderno = false;
				vm.ordenacao = ordenarPor;
				vm.processandoUnirCadernos = false;
			});
	}
	
	function carregarMaisCadernos() {
		vm.pagina += 1;
		tecDadosCadernos.carregarMais(vm.pasta.id, vm.ordenacao, vm.pagina)
		.then(function() {
			vm.itens = tecDadosCadernos.itens;
			vm.tudoSelecionado = false;
			vm.modoSelecao = false;
			vm.movendoItens = false;
			vm.excluindoItens = false;
			vm.unindoItens = false;
			vm.exportandoItens = false;
			vm.criandoCaderno = false;
			vm.processandoUnirCadernos = false;
		});
	}
	
	function recarregarPasta(subpastasParaRecarregar) {
		buscarPasta(vm.pasta.id);
		vm.listarCadernos(vm.pasta.id, subpastasParaRecarregar);
	}

	function renomearPasta(pasta) {
		tec.prompt("Digite o nome da pasta", pasta.nome, "Renomear pasta", function(nomePasta) {
			if (nomePasta && nomePasta.length) {
				tecDadosCadernos.renomearPasta(pasta.id, nomePasta)
				.then(function(data) {
					if (data.pasta) {
						pasta.nome = data.pasta.nome;
						recarregarPasta();
					}
				});
			}
		});
	}

	function alterarVisualizacaoParaCurso() {
		window.location = contextPathUrl + "aulas/bibliotecas/" + vm.pasta.id;

		var pastasString = localStorage.getItem("tec.pastasModoCurso" + "["+userId+"]");

		if (!!pastasString) {
			var pastas = new Set(JSON.parse(pastasString));
			pastas.add(vm.pasta.id);
			localStorage.setItem("tec.pastasModoCurso" + "["+userId+"]", JSON.stringify(Array.from(pastas)));
		} else {
			localStorage.setItem("tec.pastasModoCurso" + "["+userId+"]", JSON.stringify([vm.pasta.id]));
		}
	}

	function ordenar(ordenacao) {
		if (vm.ordenacao == ordenacao) {
			return;
		}
		vm.reordenarPor = ordenacao;
		recarregarPasta();
	}

	function carregarProgresso(item){
		if (item.subpasta) {
			tecDadosCadernos.carregarProgressoSubpasta(vm.pasta.id, item);
		} else {
			tecDadosCadernos.carregarProgresso(item);
		}
	}
	
	function carregarProgressoPasta(idPasta) {
		if (vm.pasta.qtdCadernos >= 200) {
			$.alerts.alert("Função disponível apenas em pastas com até 200 cadernos. Para ativar o recurso nesta pasta, você pode mover ou excluir alguns cadernos.");
            return;
		}

		tecDadosCadernos.carregarProgressoPasta(idPasta);
	}
	
	function ativarExcluirCadernos(caderno) {
		selecionarTudo(false, false);
		vm.modoSelecao = true;
		vm.excluindoItens = true;
		if (caderno) {
			selecionarLinha(caderno);
		}
	}
	
	function ativarMoverCadernos(caderno) {
		selecionarTudo(false, false);
		listarPastas();
		vm.pastaDestino = vm.pasta.id;
		vm.modoSelecao = true;
		vm.movendoItens = true;
		if (caderno) {
			selecionarLinha(caderno);
		}	
	}

	function ativarCriarCaderno(caderno) {
		selecionarTudo(false, false);
		vm.modoSelecao = true;
		vm.criandoCaderno = true;
		vm.etapaCriarCaderno = 1;

		if (caderno) {
			selecionarLinha(caderno);
		}
	}

	function proximaEtapaCriarCaderno() {
		var cadernosSelecionados = [];

		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				var desabilitarSelecaoSubpasta = !!item.cadernos;
				$(item.cadernos).each(function(_, caderno) {
					desabilitarSelecaoSubpasta = desabilitarSelecaoSubpasta && caderno.selecionado;

					if (caderno.selecionado) {
						caderno.desabilitarSelecao = true;
						caderno.selecionado = false;
						cadernosSelecionados.push(caderno);
					}
				});

				item.desabilitarSelecao = desabilitarSelecaoSubpasta;
			} else if (item.selecionado) {
				item.desabilitarSelecao = true;
                item.selecionado = false;
				cadernosSelecionados.push(item);
			}
		});

		vm.cadernosSelecionadosPrimeiraEtapa = cadernosSelecionados;
		vm.cadernosSelecionados = 0;
		vm.totalQuestoesSelecionadas = 0;
		vm.etapaCriarCaderno = 2;
	}

	function finalizarCriarCaderno() {
		var idsIncluir = [];

		$(vm.cadernosSelecionadosPrimeiraEtapa).each(function(_, item) {
			idsIncluir.push(item.id);
		});

		var idsExcluir = [];

		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				$(item.cadernos).each(function(_, caderno) {
					if (caderno.selecionado && !caderno.desabilitarSelecao) {
						idsExcluir.push(caderno.id);
					}
				});
			} else if (item.selecionado && !item.desabilitarSelecao) {
				idsExcluir.push(item.id);
			}
		});

		var query = "?pastaAtualId=" + vm.pasta.id;

		$(idsIncluir).each(function(_, id) {
			query += "&idsCadernos[]=" + id;
		});

		$(idsExcluir).each(function(_, id) {
			query += "&excluir[]=" + id;
		});

		window.location.href = contextPathUrl + "questoes/pastas/gerador" + query;
	}

	function cancelarCriarCaderno() {
		cancelarOperacaoPasta();

		if (vm.etapaCriarCaderno == 1) {
			return;
		}

		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				delete item.desabilitarSelecao;
				$(item.cadernos).each(function(_, caderno) {
					delete caderno.desabilitarSelecao;
				});
			} else {
				delete item.desabilitarSelecao;
			}
		});

		vm.etapaCriarCaderno = 1;
	}
	
	function excluirItens() {
		var mensagemExclusao = "";
		if ($.isAssinanteLogado()) {
			mensagemExclusao = "<br><br>Caso mude de idéia, você tem até 7 dias para restaurá-los indo em <strong>Questões > Cadernos excluídos</strong>. Após este prazo, eles serão excluídos permanentemente da plataforma.";
		} else {
			mensagemExclusao = "<br><br>⚠️Atenção: em contas <strong>gratuitas</strong>, a exclusão é <strong>definitiva e irreversível</strong>.<br><br>Mesmo que você faça upgrade após a exclusão, <strong>não será possível recuperá-los</strong>."
			+ "<br><br>Assinantes contam com um período de até 7 dias para recuperar cadernos excluídos por engano."
			+ "<br><br> <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos ou avalie antes de continuar.";
			
		}
		alertify.confirm("Confirmar exclusão", "Você realmente deseja excluir os cadernos selecionados? " + mensagemExclusao, function() { 
			tecDadosCadernos.excluirSelecionados()
				.then(function(dados) {
					vm.recarregarPasta(dados.subpastasAfetadas);
					if ($.isAssinanteLogado()) {
						alertify.message('Cadernos envidados para <a href="' + contextPathUrl + 'questoes/cadernos-lixeira" >Lixeira</a> ', 0);
					}
				});
		}, null).set('labels', {ok:'Excluir Cadernos', cancel:'Cancelar'}); 
	}
	
	function ativarUnirCadernos(item) {
		selecionarTudo(false, false);
		if (item) {
			vm.modoSelecao = true;
			selecionarLinha(item);
		}
		vm.modoSelecao = true;
		vm.unindoItens = true;
	}
	
	function unirCadernos() {
		vm.temCadernoUnidoLegado = false;
		for (var i = 0; i < vm.itens.length; i++) {
			if (vm.itens[i].selecionado && vm.itens[i].cadernoUnidoLegado) {
				vm.temCadernoUnidoLegado = true;
				break;
			}
		}

		// dialog exige um argumento
		alertify.unirCadernoAlert("");
	}

	function ativarExportarCadernos(item) {
		if (!$.isAssinanteAvancadoLogado()) {
			vm.mostrarAlertaPlanoAvancado();
			return;
		}

		selecionarTudo(false, false);
		if (item) {
			selecionarLinha(item);
		}
		vm.modoSelecao = true;
		vm.exportandoItens = true;
	}

	function exportarCadernos() {
		var ids = [];
		var cadernosSelecionados = [];

		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				$(item.cadernos).each(function(_, caderno) {
					if (caderno.selecionado) {
						ids.push(caderno.id);
						cadernosSelecionados.push(caderno);
					}
				});
			} else if (item.selecionado) {
				ids.push(item.id);
                cadernosSelecionados.push(item);
			}
		});

		tec.apiPost("/cadernos/compartilhamentoLista", { ids: ids}).then(function(data) {
			var links = data.map;
			var texto = 'Data,Nome,Link,Total,Resolvidas,Acertos,Erros\n';

			$(cadernosSelecionados).each(function(_, caderno) {
				for (var j = 0; j < links.length; j++) {
					if (links[j][0] == caderno.id) {
						var link = links[j][1];
					}
				}
				var item = buscarItemPorId(caderno.id);
				if(item != null && !item.subpasta) {
					texto += item.data;
					texto += ',"' + item.nome + '"';
					texto += ',' + link;
					texto += ',' + item.quantidadeItens;
					texto += item.numeroQuestoesResolvidas > 0 ? ',' + item.numeroQuestoesResolvidas : ',0';
					texto += item.porcentagemAcertos > 0 ? ',' + item.porcentagemAcertos + '%' : ',0%';
					texto += item.porcentagemErros > 0 ? ',' + item.porcentagemErros + '%' : ',0%';
					texto += '\n';
				}
			});

			var nome = vm.pasta.nome;
			var a = document.createElement('a');
			a.textContent = 'download';
			a.download = nome.replace(/\s+/g,'-') + '.csv';
			a.href = 'data:text/csv;charset=utf-8,' + escape(texto);
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}).catch(function() {
			$.alerts.alert("Erro ao exportar caderno!");
		});
	}

	function buscarItemPorId(id) {
		var buscaItem = null;
		$.each(vm.itens, function(_, item) {

			if(item.subpasta && item.cadernos != null && item.cadernos.length > 0) {
				var cadernosSubpasta = item.cadernos;
				$.each(cadernosSubpasta, function(_, itemSubpasta) {
					if(itemSubpasta.id == id) {
						buscaItem = itemSubpasta;
					}
				});
			}

			if(item.id == id) {
				buscaItem = item;
			}
		});
		return buscaItem;
	}

	function mostrarAlertaPlanoAvancado() {
		tec.alert("Esta funcionalidade está disponível para assinantes do Plano Avançado. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
	}

	function moverItens() {
		tecDadosCadernos.moverSelecionados(vm.pastaDestino, vm.subpastaDestino)
		.then(function(dados) {
			vm.recarregarPasta(dados.subpastasAfetadas);
		});
	}
	
	function cancelarOperacaoPasta() {
		vm.modoSelecao = false;
		vm.excluindoItens = false;
		vm.movendoItens = false;
		vm.unindoItens = false;
		vm.exportandoItens = false;
		vm.criandoCaderno = false;
	}

	function excluirPasta(pasta) {
		vm.pastaExcluirSelecionada = pasta;
		if (pasta.qtdCadernos && pasta.qtdCadernos > 0) {
			tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "\" juntamente com TODOS os seus cadernos?", "Exclusão de Pasta", function(confirmou) {
				if (confirmou) {
					setTimeout(function() {
						$("#campoConfirmar").val('');
						vm.confirmacaoExclusaoPasta = '';
						$("#modalExclusaoPasta").modal("show");
					}, 0);
				}
			});
		} else {
			tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "?", null, function(confirmou) {
				if (confirmou) {
					excluirPastaSemConfirmacao(pasta);
				}
			});
		}
	}

	function selecionarLinha(caderno) {
		if (vm.modoSelecao) {
			caderno.selecionado = caderno.selecionado ? !caderno.selecionado : true;
			contarItensSelecionados();
		}
	}
	
	function selecionarTudo(checked, expandir) {
		vm.tudoSelecionado = checked;
		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				if (expandir != false) {
					if (!item.expandido && (!item.cadernos || !item.cadernos.length)) {
						toggleSubpastaExpandida(item, checked);
					} else {
						if (!item.expandido) {
							item.expandido = true;
						}
					}
				}
				$(item.cadernos).each(function(_, caderno) {
					if (!caderno.desabilitarSelecao) {
						caderno.selecionado = checked;
					}
				});
			}

			if (!item.desabilitarSelecao) {
				item.selecionado = checked;
			}
		});
		contarItensSelecionados();
	}
	
	function possuiItensSelecionados() {
		return vm.cadernosSelecionados > 0;
	}

	function tratarSelecionar(item) {
		if (item.subpasta) {
			if (!item.expandido && (!item.cadernos || !item.cadernos.length)) {
				toggleSubpastaExpandida(item, item.selecionado);
			} else {
				if (!item.expandido) {
					item.expandido = true;
				}
				$(item.cadernos).each(function(_, caderno) {
					if (!caderno.desabilitarSelecao) {
						caderno.selecionado = item.selecionado;
					}
				});
			}
		} else if (item.pai) {
			var pai = item.pai;
			var selecionadoPai = true;

			for (var i = 0; i < pai.cadernos.length; i++) {
				if (!pai.cadernos[i].selecionado && !pai.cadernos[i].desabilitarSelecao) {
					selecionadoPai = false;
					break;
				}
			}

			pai.selecionado = selecionadoPai;
		}
		contarItensSelecionados();
	}

	function contarItensSelecionados() {
		var selecionados = 0;
		vm.totalQuestoesSelecionadas = 0;
		$(vm.itens).each(function(_, item) {
			if (item.subpasta) {
				$(item.cadernos).each(function(_, caderno) {
					if (caderno.selecionado) {
						selecionados++;
						contarQuestoesDosItensSelecionados(caderno);
					}
				});
			} else if (item.selecionado) {
				selecionados++;
				contarQuestoesDosItensSelecionados(item);
			}
		});
		vm.cadernosSelecionados = selecionados;
	}

	function contarQuestoesDosItensSelecionados(item) {
		if (vm.criandoCaderno) {
			vm.totalQuestoesSelecionadas += item.quantidadeItens;
			vm.limiteQuestoesAtingido = vm.totalQuestoesSelecionadas >= jsonLimiteTotal;

			if (vm.limiteQuestoesAtingido) {
				tec.alert("As pastas selecionadas, ultrapassam o limite de " + jsonLimiteTotal + " questões.", "Limite de questões");
			}
		}
	}
	
	function criarAtalhoItem(item) {
		tecDadosCadernos.criarAtalhoCaderno(item.id)
			.then(function(data) {
				if (data.erro === true) {
					tec.alert(data.mensagem, 'Informação');										
				} else {
					tec.alert('O atalho foi criado com sucesso na home.', 'Informação');
					vm.recarregarPasta();				
				}
			});			
	}

	function removerAtalhoItem(item) {
		tecDadosCadernos.removerAtalhoCaderno(item.idUsuarioSite, item.id)
			.then(function(data) {
				tec.alert('O atalho foi removido com sucesso.', 'Informação');
				vm.recarregarPasta();
			});
	}

	function renomearItem(item) {
		if (!item.subpasta) {
			$.alerts.prompt("Digite o nome do caderno", item.nome, "Renomear caderno", function(nomeCaderno) {
				if (nomeCaderno && nomeCaderno.length) {
					tecDadosCadernos.renomearCaderno(item.id, nomeCaderno)
						.then(function(data) {
							item.nome = data.nome;

							vm.recarregarPasta();
						});
				}
			});
		} else {
			$.alerts.prompt("Digite o nome da subpasta", item.nome, "Renomear subpasta", function(nome) {
				if (nome && nome.length) {
					tecDadosCadernos.renomearSubpasta(vm.pasta.id, item.id, nome)
						.then(function() {
							item.nome = nome;

							vm.recarregarPasta();
							atulizarNoComboSubPastas(item)
						});
				}
			});
		}
	}

	function excluirItem(item) {
		if (!item.subpasta) {
			vm.ativarExcluirCadernos(item);
			return;
		}

		if (item.quantidadeItens > 0) {
			$.alerts.confirm("Os cadernos presentes serão movidos para a raiz da pasta atual. Confirma a exclusão desta subpasta?", null, function(confirmou) {
				if (confirmou) {
					tecDadosCadernos.excluirSubpasta(vm.pasta.id, item.id)
						.then(function() {
							vm.recarregarPasta();
							removerDoComboSubPastas(item);
						});
				}
			});
		} else {
			tecDadosCadernos.excluirSubpasta(vm.pasta.id, item.id)
				.then(function() {
					vm.recarregarPasta();
					removerDoComboSubPastas(item);
				});
		}
	}
	
	function removerDoComboSubPastas(item) {
		if (vm.subpastasPorPasta && item) {
			for (i = 0, len = vm.subpastasPorPasta[vm.pasta.id].length; i < len; i++) {
				var subPasta = vm.subpastasPorPasta[vm.pasta.id][i];
				if (subPasta.id == item.id) {
					vm.subpastasPorPasta[vm.pasta.id].splice(i, 1);
					return;
				}
			}
		}
	}

	function atulizarNoComboSubPastas(item) {
		if (vm.subpastasPorPasta && item) {
			for (i = 0, len = vm.subpastasPorPasta[vm.pasta.id].length; i < len; i++) {
				var subPasta = vm.subpastasPorPasta[vm.pasta.id][i];
				if (subPasta.id == item.id) {
					subPasta.nome = item.nome;
					return;
				}
			}
		}
	}
	
	function compartilharCaderno(caderno) {
		tecDadosCadernos.compartilharCaderno(caderno.id)
		.then(function(data) {
			var urlShortCaderno = data.links[0];
			var link = urlShortCaderno;
		
		  navigator.clipboard.writeText(link)
		    .then(() => {
				Toastify({
				  text: "Link copiado!",
				  duration: 2500,
				  gravity: "top", // `top` or `bottom`
				  position: "center", // `left`, `center` or `right`
				  stopOnFocus: true, // Prevents dismissing of toast on hover
				  className: "info"
				}).showToast();
		    })
		    .catch(err => {
		      console.error('Failed to copy text: ', err);
		    });
		});
	}
	
	function imprimirCaderno(caderno) {
		window.location = $.getUrl("/questoes/cadernos/" + caderno.id + "/configurar-impressao");
	}

	function lineClick(caderno) {
		if (vm.modoSelecao) {
			if (caderno.desabilitarSelecao) {
				return;
			}

			caderno.selecionado = caderno.selecionado ? !caderno.selecionado : true;
			contarItensSelecionados();
		} else {
			window.location = $.getUrl("/questoes/cadernos/" + caderno.id);
		}
	}

	function criarSubpasta() {
		tec.prompt("Digite o nome da subpasta", "", "Criar subpasta", function(nome) {
			if (nome && nome.length) {
				tecDadosCadernos.criarSubpasta(vm.pasta.id, nome)
					.then(function(data) {
						if (!!vm.pastas && !!vm.subpastasPorPasta) {
							if (!vm.subpastasPorPasta[vm.pasta.id]) {
								vm.subpastasPorPasta[vm.pasta.id] = [];
							}

							vm.subpastasPorPasta[vm.pasta.id].push(data.subpasta);
							vm.subpastasPorPasta[vm.pasta.id] = ordenarSubpastas(vm.subpastasPorPasta[vm.pasta.id]);
						}

						vm.recarregarPasta();
					});
			}
		});
	}

	function toggleSubpastaExpandida(item, selecionado) {
		item.expandido = !item.expandido;

		if (item.expandido && item.subpasta && (!item.cadernos || !item.cadernos.length)) {
			var ordenarPor = vm.reordenarPor || vm.ordenacao;

			tecDadosCadernos.listarItensSubpasta(vm.pasta.id, item.id, ordenarPor)
				.then(function(itens) {
					item.cadernos = itens;

					$(item.cadernos).each(function(_, caderno) {
						caderno.pai = item;
						caderno.selecionado = selecionado;
					});
					contarItensSelecionados();
				});
		}
	}

	
	//private functions
	function excluirPastaSemConfirmacao(pasta) {
		tecDadosCadernos.excluirPasta(pasta.id)
		.then(function() {
			var baseHref = document.getElementsByTagName('base')[0].href;
			window.location.href = baseHref;
		});
	}
	
	function dialogoUnirCadernoSelecionarPasta() {		
		var idPasta = $("#idDialogoUnirCadernoPasta").val();
		var subpastas = vm.subpastasPorPasta[idPasta];
		
		$("#idDialogoUnirCadernoSubPasta option").each(function() {
			$(this).remove();
		});
		if (subpastas) {
			$("#idDialogoUnirCadernoSubPasta").removeAttr('disabled');		

			$("#idDialogoUnirCadernoSubPasta").append("<option></option>");
			for (var i in subpastas) {
				var pasta = subpastas[i];
				
				$("#idDialogoUnirCadernoSubPasta").append("<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\">"+pasta.nome+"</option>");
			}
		} else {
			$("#idDialogoUnirCadernoSubPasta").attr('disabled', 'disabled');
		}
	}
	
	function gerarNomeCadernoUniao() {
		var nome = "[União] ";
		var primeiro = true;
		for (var i = 0; i < vm.itens.length; i++) {
			if (vm.itens[i].selecionado) {
				if (primeiro) {
					nome += vm.itens[i].nome;
					primeiro = false;
				} else {
					nome += ", " + vm.itens[i].nome;
				}
			}
		}
		
		return nome;
	}
	
	function criarDialogoUnirCaderno() {
		alertify.dialog("unirCadernoAlert", function factory() {
			return {
				main:function(){
					var alertaCadernoUnido = "<div class='unir-cadernos-modal-warning'>" +
												"<img src='" + contextPathUrl + "img/common/icone-aviso.png' alt='Ponto de Exclamação'/>"+
                    							"<strong>Atenção:</strong> Você selecionou um caderno que foi criado usando a versão antiga do 'unir cadernos'. "+
                    							"Devido a isso, o caderno gerado não poderá ser editado ou atualizado." +
                                              "</div>";

					var selectPastas = "<select name=\"idDialogoUnirCadernoPasta\" id=\"idDialogoUnirCadernoPasta\" class=\"form-control\">";
					for (var i in vm.pastas) {
						var pasta = vm.pastas[i];
						if (pasta.id == vm.pasta.id) {
							selectPastas += "<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\" selected=\"selected\" >"+pasta.nome+"</option>"
						} else {
							selectPastas += "<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\">"+pasta.nome+"</option>"						
						}
					}
                    
                    selectPastas += "</select>";
                    
                    var selectSubPastas = "";
                    if (vm.subpastasPorPasta[vm.pasta.id]) {
	                    selectSubPastas = "<select name=\"idDialogoUnirCadernoSubPasta\" id=\"idDialogoUnirCadernoSubPasta\" class=\"form-control\">";
					} else {
	                    selectSubPastas = "<select name=\"idDialogoUnirCadernoSubPasta\" id=\"idDialogoUnirCadernoSubPasta\" class=\"form-control\" disabled=\"disabled\">";						
					}
					selectSubPastas += "<option selected=\"selected\"></option>"	                    
					for (var i in vm.subpastasPorPasta[vm.pasta.id]) {
						var pasta = vm.subpastasPorPasta[vm.pasta.id];
						
						selectSubPastas += "<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\">"+pasta.nome+"</option>"						
					}
                    
                    selectSubPastas += "</select>";
                    
                    var nomeCaderno = gerarNomeCadernoUniao();

					this.message = "<div class=\"unir-cadernos-modal\">" +
									"<p>Criar um novo caderno com as questões dos cadernos selecionados.</p>" +
									(vm.temCadernoUnidoLegado ? alertaCadernoUnido : "") +
									"<p class=\"unir-cadernos-modal-titulo\"><strong>Importar resoluções anteriores?</strong></p>" +
									"<p class=\"unir-cadernos-modal-opcao\">" +
									"<input type=\"radio\" name=\"importar\" value=\"nao\" checked><label for=\"nao\">Não</label>" +
									"<input class=\"unir-cadernos-modal-opcao-sim\"type=\"radio\" name=\"importar\" value=\"sim\"><label for=\"sim\">Sim</label>" +
									"</p>" +
									"<p class=\"unir-cadernos-modal-titulo\"><strong>Excluir os cadernos selecionados?</strong></p>" +
									"<p class=\"unir-cadernos-modal-opcao\">" +
									"<input type=\"radio\" name=\"excluir\" value=\"nao\" checked><label for=\"nao\">Não</label>" +
									"<input class=\"unir-cadernos-modal-opcao-sim\" type=\"radio\" name=\"excluir\" value=\"sim\"><label for=\"sim\">Sim</label>" +
									"<span class=\"unir-cadernos-modal-opcao-aviso\">(não pode ser desfeito)</span></p>" +
									"<p class=\"unir-cadernos-modal-titulo\"><strong>Nome do caderno:</strong></p>" +
									"<p class=\"unir-cadernos-modal-opcao\">" +
									"<input class=\"unir-cadernos-modal-opcao-input form-control\" type=\"text\" name=\"nome-caderno-final\" value=\""+nomeCaderno+"\" />" +
									"</p>" +
									"<p class=\"unir-cadernos-modal-titulo\"><strong>Pasta de destino:</strong></p>" +
									"<p class=\"unir-cadernos-modal-opcao\">" +
									selectPastas +
									"</p>" +
									"<p class=\"unir-cadernos-modal-titulo\"><strong>Subpasta de destino:</strong></p>" +
									"<p class=\"unir-cadernos-modal-opcao\">" +
									selectSubPastas +
									"</p>" +
									"</div>"
				},
				setup:function(){
					return { 
						buttons:[{text: "<button onclick=\"$(this).parent().click()\" class=\"btn btn-tec unir-cadernos-modal-botao-criar\">CRIAR</button>"}, 
							{text: "<button onclick=\"$(this).parent().click()\" class=\"btn btn-tec unir-cadernos-modal-botao-fechar\"><span class='glyphicon glyphicon-remove unir-cadernos-botao-fechar-icone'></span><span>FECHAR</span></button>"}],
						focus: { element:0 },
						options: {
							title: "UNIR CADERNOS",
							onshow: function() {								
								$("#idDialogoUnirCadernoPasta").on('change', function() {
									dialogoUnirCadernoSelecionarPasta();
								});
								dialogoUnirCadernoSelecionarPasta();
							}
						}

					};
				},
				prepare:function(){					
					this.setContent(this.message);
					$('.ajs-dialog').removeClass("ajs-dialog-height ajs-dialog-height-warning");
					$('.ajs-dialog').addClass(vm.temCadernoUnidoLegado ? "ajs-dialog-height-warning" : "ajs-dialog-height");
				},
				callback:function(closeEvent) {
					if (closeEvent.index == 0) {
						var ajsBody = $(this.elements.body);
						var importar = ajsBody.find("input[name='importar']:checked").val() == "sim";
						var excluir = ajsBody.find("input[name='excluir']:checked").val() == "sim";
						var nomeFinal = ajsBody.find("input[name='nome-caderno-final']").val();
						var idPasta = ajsBody.find("select[id='idDialogoUnirCadernoPasta']").val();
						var idSubpasta = ajsBody.find("select[id='idDialogoUnirCadernoSubPasta']").val();

						vm.processandoUnirCadernos = true;
						tecDadosCadernos.unirCadernos(importar, nomeFinal, idPasta, idSubpasta)
						.then(function(retorno) {
							if (retorno.erro) {
								$.alerts.alert(retorno.erro.mensagem, "Erro na criação do caderno");
								vm.recarregarPasta();
							} else if(retorno.long) {
								$.alerts.alert("O novo caderno foi gerado na pasta informada.", "Caderno gerado");
								if (excluir) {
									tecDadosCadernos.excluirSelecionados()
									.then(function(dados) {
										vm.recarregarPasta(dados.subpastasAfetadas);
									});
								} else {
									vm.recarregarPasta();
								}
							}
							$('.ajs-dialog').removeClass("ajs-dialog-height ajs-dialog-height-warning");
						});
					}
				}
			}
		});
	}

	function listarPastas(){
		if (tecDadosCadernos.pastas.length == 0) {
			tecDadosCadernos.listarPastas()
			.then(function(data) {
				tecDadosCadernos.pastas = data.pastas;
				vm.pastas = tecDadosCadernos.pastas;

				vm.subpastasPorPasta = {};
				$(vm.pastas).each(function(_, pasta) {
					if (!!pasta.subpastas && pasta.subpastas.length > 0) {
						vm.subpastasPorPasta[pasta.id] = ordenarSubpastas(pasta.subpastas)
					}
				});
			});
		}
	}

	function ordenarSubpastas(argumento){
	  return [].slice.call(argumento).sort(function(a,b){
	    return a.nome.localeCompare(b.nome)
	  });
	}

	function desabilitarBotaoApagarPasta() {
		var confirmacao;
		if (vm.confirmacaoExclusaoPasta) {
			confirmacao = vm.confirmacaoExclusaoPasta.toUpperCase();
		}
		var disabled = !(confirmacao == 'APAGAR PASTA');
		return disabled;
	}
	
	function fecharModalConfirmarExclusaoPasta() {
		$("#campoConfirmar").val('');
		vm.confirmacaoExclusaoPasta = '';
		$("#modalExclusaoPasta").modal("hide");
	}
	
	function excluirPastaConfirmado() {		
		fecharModalConfirmarExclusaoPasta();
		excluirPastaSemConfirmacao(vm.pastaExcluirSelecionada);
	}

});



//////////////////////////////

module.factory("tecDadosCadernos", function($q, tec, $window) {
	var service = {
		pasta: null,
		pastas: [],
		cadernos: [],
		mapCadernos: null,
		listarItens: listarItens,
		listarItensSubpasta: listarItensSubpasta,
		buscarPasta: buscarPasta,
		listarPastas: listarPastas,
		criarPasta: criarPasta,
		excluirPasta: excluirPasta,
		renomearPasta: renomearPasta,
		excluirSelecionados: excluirSelecionados,
		moverSelecionados: moverSelecionados,
		renomearCaderno: renomearCaderno,
		criarAtalhoCaderno: criarAtalhoCaderno,
		removerAtalhoCaderno: removerAtalhoCaderno,
		compartilharCaderno: compartilharCaderno,
		unirCadernos: unirCadernos,
		carregarMais: carregarMais,
		carregarProgresso: carregarProgresso,
		carregarProgressoPasta: carregarProgressoPasta,
		exibirBotaoCarregarMaisCadernos: false,

		criarSubpasta: criarSubpasta,
		renomearSubpasta: renomearSubpasta,
		excluirSubpasta: excluirSubpasta,
		carregarProgressoSubpasta: carregarProgressoSubpasta,

		_tamanho_pagina: 0
	};
	
	ativar();
	
	return service;

	function ativar() {
		service.mapCadernos = new Map();
		service.mapSubpastas = new Map();

		service._tamanho_pagina = 10;
		if ($.isAssinanteAvancadoLogado()) {
			service._tamanho_pagina = 60;
		} else if ($.isAssinanteLogado()) {
			service._tamanho_pagina = 30;
		}
	}
	
	function validarExibirBotaoCarregarMaisCadernos(cadernos) {
		if (!cadernos || cadernos.length < service._tamanho_pagina) {
			service.exibirBotaoCarregarMaisCadernos = false;
		} else {
			service.exibirBotaoCarregarMaisCadernos = true;
		}
	}

	function buscarPasta(idPasta){
		return tec.apiGet("/pastas-cadernos/" + idPasta);
	}

	function listarItens(idPasta, ordenacao, pagina, subpastasParaRecarregar) {
		ordenacao = ordenacao || "nome";
		return tec.apiGet("/pastas-cadernos/" + idPasta + "/itens", { ordenacao: ordenacao, paginar: true, pagina: pagina })
		.then(function(data) {
			data = data || {};

			service.itens = prepararItens(data.itens, subpastasParaRecarregar, idPasta, ordenacao);
			validarExibirBotaoCarregarMaisCadernos(service.itens);
		});
	}

	function listarItensSubpasta(idPasta, idSubpasta, ordenacao) {
		ordenacao = ordenacao || "nome";

		return tec.apiGet("/pastas-cadernos/" + idPasta + "/subpastas/" + idSubpasta + "/itens", { ordenacao: ordenacao })
			.then(function(data) {
				data = data || {};

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

				return data.itens;
			});
	}

	function carregarMais(idPasta, ordenacao, pagina) {
		ordenacao = ordenacao || "nome";

		return tec.apiGet("/pastas-cadernos/" + idPasta + "/itens", { ordenacao: ordenacao, paginar: true, pagina: pagina })
		.then(function(data) {
			data = data || {};

			if (data.itens.length > 0) {
				validarExibirBotaoCarregarMaisCadernos(data.itens);
				if (!service.itens) {
					service.itens = prepararItens(data.itens);
				} else {
					Array.prototype.push.apply(service.itens, prepararItens(data.itens));
				}
				carregarProgressoItens(service.mapCadernos, service.mapSubpastas);
			} else {
				service.exibirBotaoCarregarMaisCadernos = false;
			}
		});
	}

	function listarPastas() {
		return tec.apiGet("/pastas-cadernos/", { buscarSubpastas: true });
	}

	function criarPasta(nome) {
		return tec.apiPost("/pastas-cadernos", { nome: nome })
		.catch(function(error) {
			$.alerts.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}
	function excluirSelecionados(ids) {
		if (ids === null || typeof ids === 'undefined') {
			ids = encontrarCadernosSelecionados();
		}

		return tec.apiPost("/cadernos/multiple-delete", { cadernos: ids.cadernos })
			.then(function(data) {
				return { subpastasAfetadas: ids.subpastas, data: data };
			});
	}

	function unirCadernos(importarResolucoes, nomeFinal, idPasta, idSubpasta) {
		var ids = encontrarCadernosSelecionados().cadernos;
		return tec.apiPost("/cadernos/unir-cadernos", { cadernos: ids, importarResolucoes: importarResolucoes, nomeFinal: nomeFinal, idPasta: idPasta, idSubpasta: idSubpasta });
	}

	function moverSelecionados(pastaDestino, subpastaDestino, ids) {
		if (ids === null || typeof ids === 'undefined') {
			ids = encontrarCadernosSelecionados();
		}

		return tec.apiPost("/cadernos/multiple-set", { cadernos: ids.cadernos, pastaDestino: pastaDestino, subpastaDestino: subpastaDestino })
			.then(function(data) {
				if (!!subpastaDestino) {
					ids.subpastas.push(subpastaDestino);
				}

				return { subpastasAfetadas: ids.subpastas, data: data };
			});
	}

	function renomearCaderno(idCaderno, nomeCaderno) {
		return tec.apiPut("/cadernos/" + idCaderno, { nome: nomeCaderno });
	}
	
	function criarAtalhoCaderno(idCaderno) {
		return tec.apiPost("/atalhos-caderno-home/criar", { idCadernoQuestoes: idCaderno });
	}

	function removerAtalhoCaderno(idUsuarioSite, idCaderno) {
		return tec.apiDelete("/atalhos-caderno-home/excluir", { idUsuarioSite: idUsuarioSite, idCadernoQuestoes: idCaderno });
	}
	
	function compartilharCaderno(idCaderno) {
		return tec.apiPost("/cadernos/" + idCaderno + "/compartilhamento");
	}
	
	function carregarProgresso(caderno){
		tec.apiGet("/cadernos/"+ caderno.id + "/progresso")
		.then(function(data) {
			data = data.progresso || {};
			caderno.numeroTotalQuestoes = data.numeroTotalQuestoes;
			caderno.numeroQuestoesResolvidas = data.numeroQuestoesResolvidas;
			caderno.porcentagemAcertos = data.porcentagemAcertos;
			caderno.porcentagemErros = data.porcentagemErros;

			caderno.porcentagemAcertosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroAcertos / data.numeroQuestoesResolvidas)).toFixed(2);
            caderno.porcentagemErrosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroErros / data.numeroQuestoesResolvidas)).toFixed(2);
		});
	}

	function carregarProgressoPasta(idPasta) {
		if (!service.pasta) {
			return;
		}
		tec.apiGet("/pastas-cadernos/"+ (idPasta || 0) + "/progresso")
		.then(function(data) {
			data = data.progresso || {};
			service.pasta.numeroTotalQuestoes = data.numeroTotalQuestoes;
			service.pasta.numeroQuestoesResolvidas = data.numeroQuestoesResolvidas;
			service.pasta.porcentagemAcertos = data.porcentagemAcertos;
			service.pasta.porcentagemErros = data.porcentagemErros;

			service.pasta.porcentagemAcertosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroAcertos / data.numeroQuestoesResolvidas)).toFixed(2);
			service.pasta.porcentagemErrosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroErros / data.numeroQuestoesResolvidas)).toFixed(2);

			var cadernos = data.cadernos || [];
			$(cadernos).each(function(_, caderno) {
				service.mapCadernos.set(caderno.id, caderno);
			});

			var subpastas = data.subpastas || [];
			$(subpastas).each(function(_, subpasta) {
				service.mapSubpastas.set(subpasta.id, subpasta);
			});

			carregarProgressoItens(service.mapCadernos, service.mapSubpastas);
		});
	}

	function carregarProgressoSubpasta(idPasta, subpasta) {
		tec.apiGet("/pastas-cadernos/"+ idPasta + "/subpastas/" + subpasta.id + "/progresso")
			.then(function(data) {
				var data = data.progresso || {};
				subpasta.numeroTotalQuestoes = data.numeroTotalQuestoes;
				subpasta.numeroQuestoesResolvidas = data.numeroQuestoesResolvidas;
				subpasta.porcentagemAcertos = data.porcentagemAcertos;
				subpasta.porcentagemErros = data.porcentagemErros;

				subpasta.porcentagemAcertosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroAcertos / data.numeroQuestoesResolvidas)).toFixed(2);
                subpasta.porcentagemErrosResolvidas = data.numeroQuestoesResolvidas == 0 ? 0 : (100 * (data.numeroErros / data.numeroQuestoesResolvidas)).toFixed(2);

				var cadernos = data.cadernos || [];

				$(cadernos).each(function(_, caderno) {
					service.mapCadernos.set(caderno.id, caderno);
				});

				carregarProgressoCadernosSubpasta(subpasta, service.mapCadernos);
			});
	}

	function carregarProgressoItens(mapCadernos, mapSubpastas) {
		if (mapCadernos == null || mapSubpastas == null) {
			return;
		}

		$(service.itens).each(function(_, item) {
			var dadosNovos;

			if (item.subpasta) {
				dadosNovos = mapSubpastas.get(item.id);

				carregarProgressoCadernosSubpasta(item, mapCadernos);
			} else {
				dadosNovos = mapCadernos.get(item.id);
			}

			if (dadosNovos) {
				item.numeroTotalQuestoes = dadosNovos.numeroTotalQuestoes;
				item.numeroQuestoesResolvidas = dadosNovos.numeroQuestoesResolvidas;
				item.porcentagemAcertos = dadosNovos.porcentagemAcertos;
				item.porcentagemErros = dadosNovos.porcentagemErros;

				item.porcentagemAcertosResolvidas = dadosNovos.numeroQuestoesResolvidas == 0 ? 0 : (100 * (dadosNovos.numeroAcertos / dadosNovos.numeroQuestoesResolvidas)).toFixed(2);
                item.porcentagemErrosResolvidas = dadosNovos.numeroQuestoesResolvidas == 0 ? 0 : (100 * (dadosNovos.numeroErros / dadosNovos.numeroQuestoesResolvidas)).toFixed(2);
			}
		});
	}

	function carregarProgressoCadernosSubpasta(subpasta, mapCadernos) {
		$(subpasta.cadernos).each(function(_, caderno) {
			var dadosNovos = mapCadernos.get(caderno.id);

			if (dadosNovos) {
				caderno.numeroTotalQuestoes = dadosNovos.numeroTotalQuestoes;
				caderno.numeroQuestoesResolvidas = dadosNovos.numeroQuestoesResolvidas;
				caderno.porcentagemAcertos = dadosNovos.porcentagemAcertos;
				caderno.porcentagemErros = dadosNovos.porcentagemErros;

				caderno.porcentagemAcertosResolvidas = dadosNovos.numeroQuestoesResolvidas == 0 ? 0 : (100 * (dadosNovos.numeroAcertos / dadosNovos.numeroQuestoesResolvidas)).toFixed(2);
				caderno.porcentagemErrosResolvidas = dadosNovos.numeroQuestoesResolvidas == 0 ? 0 : (100 * (dadosNovos.numeroErros / dadosNovos.numeroQuestoesResolvidas)).toFixed(2);
			}
		});
	}

	function renomearPasta(idPasta, nomePasta) {
		return tec.apiPut("/pastas-cadernos/" + idPasta, { nome: nomePasta })
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}

	function excluirPasta(idPasta) {
		return tec.apiDelete("/pastas-cadernos/" + idPasta);
	}

	function criarSubpasta(idPasta, nome) {
		return tec.apiPost("/pastas-cadernos/" + idPasta + "/subpastas", { nome: nome })
			.catch(function(error) {
				tec.alert("Já existe uma subpasta com esse nome.")
				return $q.reject(error);
			});
	}

	function renomearSubpasta(idPasta, idSubpasta, nome) {
		return tec.apiPut("/pastas-cadernos/" + idPasta + "/subpastas/" + idSubpasta, { nome: nome })
			.catch(function(error) {
				tec.alert("Já existe uma subpasta com esse nome.")
				return $q.reject(error);
			});
	}

	function excluirSubpasta(idPasta, idGrupo) {
		return tec.apiDelete("/pastas-cadernos/" + idPasta + "/subpastas/" + idGrupo);
	}

	//private functions
	
	function prepararItens(itens, subpastasParaRecarregar, idPasta, ordenacao) {
		$(itens).each(function(_, item) {
			if (item.subpasta) {
				item.expandido = false;
			} else {
				item.objetivas = item.formatoQuestoes == "OBJETIVA";
			}
		});
		return copiarDadosDeItensJaCarregados(service.itens, itens, subpastasParaRecarregar, idPasta, ordenacao);
	}

	function copiarDadosDeItensJaCarregados(origem, destino, subpastasParaRecarregar, idPasta, ordenacao) {
		var merged = [];
		var mapItensComDadosParaCopiar = {};

		$(origem).each(function(_, item) {
			if (item.porcentagemAcertos != undefined || (item.subpasta && item.expandido) ) {
				mapItensComDadosParaCopiar[item.id] = item;
			}
		});

		$(destino).each(function(_, item) {
			var itemComDadosParaCopiar = mapItensComDadosParaCopiar[item.id];
			var obj = itemComDadosParaCopiar ? angular.copy(itemComDadosParaCopiar) : angular.copy(item);

			// A data não deve ser mantida pois o valor dela muda de acordo com a ordenação
			obj.data = item.data;

			verificarRecarregarSubpasta(obj, subpastasParaRecarregar, idPasta, ordenacao);

			merged.push(obj);
		});

		return merged;
	}

	function verificarRecarregarSubpasta(obj, subpastasParaRecarregar, idPasta, ordenacao) {
		if (!obj.subpasta || !subpastasParaRecarregar || !subpastasParaRecarregar.includes(obj.id)) {
			return;
		}

		listarItensSubpasta(idPasta, obj.id, ordenacao)
			.then(function(itens) {
				obj.cadernos = itens;
				obj.quantidadeItens = itens.length;

				$(obj.cadernos).each(function(_, caderno) {
					caderno.pai = obj;
				});

				if (obj.expandido && (!obj.cadernos || obj.cadernos.length == 0)) {
					obj.expandido = false;
				}
			});

		if (obj.porcentagemAcertos != undefined) {
			carregarProgressoSubpasta(idPasta, obj);
		}
	}

	function encontrarCadernosSelecionados() {
		var ids = [];
		var subpastas = new Set();
		$(service.itens).each(function(_, item) {
			if (item.subpasta) {
				$(item.cadernos).each(function(_, caderno) {
					if (caderno.selecionado) {
						ids.push(caderno.id);
						subpastas.add(item.id);
					}
				});
            } else if (item.selecionado) {
				ids.push(item.id);
			}

		});

		var arraySubpastas = [];
		if (subpastas.size > 0) {
			subpastas.forEach(function(id) { arraySubpastas.push(id) });
		}

		return { cadernos: ids, subpastas: arraySubpastas };
	}
});

})();
