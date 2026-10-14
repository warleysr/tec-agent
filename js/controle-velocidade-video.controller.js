(function() { 'use strict';

angular
	.module("tec.componentes")
	.controller("TecControleVelocidadeVideoController", TecControleVelocidadeVideoController);

TecControleVelocidadeVideoController.$inject = [];

function TecControleVelocidadeVideoController() {
	
	var vm = this;
	
	vm.velocidadeAtual = 1;
	vm.mudarVelocidade = mudarVelocidade;
	vm.deveExibir = deveExibir;
	
	function mudarVelocidade(novaVelocidade) {
		vm.velocidadeAtual = novaVelocidade;
		
		// Vídeo próprio: o <video> nativo aceita a velocidade direto na
		// propriedade, sem API nenhuma no meio.
		var videoProprio = elemento("video");
		if (videoProprio) {
			videoProprio.playbackRate = novaVelocidade;
			return;
		}
		
		var videoIframe = elemento("iframe");
		if (videoIframe) {
			videoIframe.contentWindow.postMessage('{"event":"command","func":"setPlaybackRate","args":[' + vm.velocidadeAtual + ', true]}', '*');
		}
	}
	
	/**
	 * No app e no mobile, tanto para o YouTube quanto para o vídeo próprio: no
	 * desktop a velocidade fica a cargo do player.
	 *
	 * Exceção: vídeo próprio no Firefox do desktop. O player nativo dele não tem
	 * botão de velocidade, só a opção no menu do botão direito, que o <video>
	 * desabilita para esconder o "Salvar vídeo".
	 */
	function deveExibir() {
		var videoProprio = elemento("video");

		if (!$.isApp() && !$.isMobileOrTabletBrowser()) {
			return !!videoProprio && /Firefox\//.test(navigator.userAgent);
		}

		if (videoProprio) {
			return true;
		}

		var videoIframe = elemento("iframe");
		return !!videoIframe && $.isYoutubeVideo(videoIframe.src);
	}
	
	function elemento(tag) {
		return $("#" + vm.videoId + " " + tag).get(0) || null;
	}
	
}

})();
