(function() { 'use strict';
	
/**
Componente de controle de velocidade de reprodução de vídeo, tanto do
YouTube quanto das videoaulas próprias.

Params:
	video-id:
		id do elemento que contém o vídeo -- um <iframe> do YouTube ou um
		<video> nativo, no caso da videoaula própria

Exemplo:
	<tec-controle-velocidade-video video-id="..."></controle-velocidade-video>
*/
angular
	.module("tec.componentes")
	.directive("tecControleVelocidadeVideo", TecControleVelocidadeVideo);

function TecControleVelocidadeVideo($sce) {

	var directive = {
		restrict: 'E',
		templateUrl: $sce.trustAsUrl(contextPathUrl + 'js/angular/components/controle-velocidade-video/controle-velocidade-video.template.html?v=' + tecAppVersion),
		scope: {
			videoId: '@'
		},
		controller: 'TecControleVelocidadeVideoController',
		controllerAs: 'vm',
        bindToController: true
	};
	
	return directive;
	
}

})();