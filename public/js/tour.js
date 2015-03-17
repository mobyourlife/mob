var tour = new Tour({
    template: '<div class="popover tour-tour tour-tour-0 fade bottom in" role="tooltip" id="step-0" style="display: block; top: 39px; left: 68px;"> <div class="arrow"></div> <h3 class="popover-title"></h3> <div class="popover-content"></div> <div class="popover-navigation"> <div class="btn-group"> <button class="btn btn-sm btn-default" data-role="prev">« Voltar</button> <button class="btn btn-sm btn-default" data-role="next">Avançar »</button>  </div> <button class="btn btn-sm btn-default" data-role="end">Terminar</button> </div> </div>',
    steps: [
        {
            backdrop: true,
            orphan: true,
            title: 'Parabéns!',
            content: 'Você acabou de criar o seu novo site!'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#brand',
            title: 'Que endereço maluco!?',
            content: 'Não se preocupe! Este endereço &quot;' + location.host + '&quot; é temporário! Você poderá personalizá-lo com um .com.br ou qualquer outro domínio de seu gosto.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#usermenu',
            title: 'Meu painel',
            content: 'Através deste menu você pode personalizar o seu site: mudar cores, adicionar uma foto de capa e personalizar o seu endereço web.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#jumbotron',
            title: 'Mensagem de boas vindas',
            content: 'Para personalizá-la, mude a descrição curta de sua fanpage.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#menu_inicio',
            title: 'Início',
            content: 'Esta página irá exibir tudo o que for publicado na linha do tempo da sua fanpage.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#menu_sobre',
            title: 'Sobre',
            content: 'Forneça o máximo de detalhes sobre o seu negócio na fanpage do Facebook. Estes detalhes irão formar esta página.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#menu_fotos',
            title: 'Fotos',
            content: 'Todas as fotos publicadas em sua fanpage serão agrupadas nesta página.'
        },
        {
            backdrop: true,
            placement: 'bottom',
            element: '#menu_contato',
            title: 'Contato',
            content: 'É importante que você preencha o email nas configurações da sua fanpage! Nesta página seus visitantes poderão entrar em contato com você. Seus dados de endereço e telefone também serão exibidos.'
        },
        {
            backdrop: true,
            orphan: true,
            title: 'Divirta-se!',
            content: 'Bom, é isso! Divirta-se atualizando o seu site. Em caso de dúvidas, contate a nossa equipe através do email <a href="mailto:suporte@mobyourlife.com.br">suporte@mobyourlife.com.br</a>. Será um prazer atendê-lo! Obrigado!'
        }
    ]
});

tour.init();