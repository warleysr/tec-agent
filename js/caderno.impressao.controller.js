(function() {
	'use strict';

	angular
		.module("tec.caderno")
		.controller("TecCadernoImpressaoController", TecCadernoImpressaoController);

	TecCadernoImpressaoController.$inject = ["$scope", "$timeout"];

	function TecCadernoImpressaoController($scope, $timeout) {
		var vm = this;

		vm.limiteQuestoes = 1;
		vm.quantidadeQuestoes = 1;
		vm.questaoInicial = 1;
		vm.configuracoes = {};
		vm.espacoEntreQuestoes = 1;
		vm.espacoEntreAlternativas = 1;
		vm.totalQuestoesSelecionadas = 0;

		vm.quantidades = {
			resolvidas: 0,
			certas: 0,
			favoritas: 0
		}

		vm.questoesRestantes = null;

		vm.quantidadeQuestoesGetterSetter = quantidadeQuestoesGetterSetter;
		vm.calcularQuantidadeMaxima = calcularQuantidadeMaxima;
		vm.calcularResumoDaImpressao = calcularResumoDaImpressao;
		vm.mostrarAlertaPlanoAvancado = mostrarAlertaPlanoAvancado;
		vm.confirmarImpressao = confirmarImpressao;

		activate();

		function activate() {
			// Busca do backend por que as quantidade do vm.caderno não são atualizadas se resolver questões após abrir a tela
			// e atualizar esses dados quando resolver é complicado devido ao "resolver todas questões marcadas"
			$.getJSON(contextPathUrl + "api/cadernos/" + vm.caderno.idCaderno + "/impressao/quantidade-questoes", {}, function(data) {
				vm.quantidades.resolvidas = data.quantidades.numeroQuestoesResolvidas;
				vm.quantidades.certas = data.quantidades.numeroAcertos;
				vm.quantidades.favoritas = data.quantidades.numeroQuestoesFavoritas;
			});

			$.getJSON(contextPathUrl + "api/cadernos/impressoes/restantes", {}, function(data) {
				$timeout(function() {
					vm.questoesRestantes = data.int;
					vm.calcularQuantidadeMaxima(vm.questaoInicial);
				});
			});

			vm.calcularQuantidadeMaxima();

			$timeout(function(){
				vm.quantidadeQuestoes = vm.limiteQuestoes;
			});

			$scope.$watch("vm.quantidadeQuestoes", function(novo, antigo) {
				vm.calcularResumoDaImpressao();
			});
			
			vm.configuracoes.rascunho = 'NENHUM';
			vm.configuracoes.remover = 'NENHUMA';
			vm.totalQuestoesSelecionadas = vm.limiteQuestoes;
		}

		function quantidadeQuestoesGetterSetter(quantidade) {
			// Isso é nescessário por que o input[range] trabalha com Strings enquanto o input[number] com Numbers
			return arguments.length && quantidade != null ? (vm.quantidadeQuestoes = parseInt(quantidade)) : vm.quantidadeQuestoes;
		}

		function calcularQuantidadeMaxima(questaoInicial) {
			questaoInicial = questaoInicial != null ? questaoInicial : 1;

			vm.limiteQuestoes = Math.min(vm.caderno.numeroTotalQuestoes - (questaoInicial - 1), 200);
			if (vm.questoesRestantes != null) {
				vm.limiteQuestoes = Math.max(0, Math.min(vm.limiteQuestoes, vm.questoesRestantes));
			}

			if (vm.quantidadeQuestoes > vm.limiteQuestoes) {
				vm.quantidadeQuestoesGetterSetter(vm.limiteQuestoes);
			}
		}
		
		function calcularResumoDaImpressao() {
			if (vm.configuracoes.remover == 'RESOLVIDAS') {
				vm.totalQuestoesSelecionadas = Math.min(vm.caderno.numeroTotalQuestoes - vm.quantidades.resolvidas, vm.quantidadeQuestoes);
			} else if (vm.configuracoes.remover == 'ACERTADAS') {
				vm.totalQuestoesSelecionadas = Math.min(vm.caderno.numeroTotalQuestoes - vm.quantidades.certas, vm.quantidadeQuestoes);
			} else if (vm.configuracoes.remover == 'NAO_FAVORITAS') {
            	vm.totalQuestoesSelecionadas = Math.min(vm.quantidades.favoritas, vm.quantidadeQuestoes);
			} else {
				vm.totalQuestoesSelecionadas = vm.quantidadeQuestoes;
			}
		}

		function mostrarAlertaPlanoAvancado(e) {
			e.preventDefault();
			$.alerts.alert("Esta funcionalidade está disponível para assinantes do Plano Avançado. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
		}

		function confirmarImpressao(e) {
			if (vm.questoesRestantes == null) {
				return; // sem informação do limite, segue o fluxo normal de impressão
			}

			e.preventDefault();

			if (vm.questoesRestantes <= 0) {
				return;
			}

			var quantidadeQuestoes = vm.totalQuestoesSelecionadas;

			var mensagem = "Você tem um saldo de <strong>" + vm.questoesRestantes + "</strong> " + (vm.questoesRestantes == 1 ? "questão" : "questões") + " para impressão hoje. Esta impressão consumirá " + quantidadeQuestoes + " " + (quantidadeQuestoes == 1 ? "questão" : "questões") + ". Deseja continuar?";

			var form = $(e.target).closest("form")[0];
			$.alerts.confirm(mensagem, "Confirmar Impressão", function(result) {
				if (result) {
					form.submit();
					$timeout(function() {
						vm.questoesRestantes = Math.max(0, vm.questoesRestantes - quantidadeQuestoes);
						vm.calcularQuantidadeMaxima(vm.questaoInicial);
					});
				}
			});
		}
	}
})();
