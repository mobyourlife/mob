$(document).ready(function() {
    $.ajax(
        {
            url: "http://www.mobyourlife.com.br/api/login",
            type: "GET",
            dataType: 'json',
            xhrFields: { withCredentials: true }
        }
    ).done(function(res) {
        if (res.auth === true) {
            $('.loggedout').hide();
            $('.loggedin').show();
            $('.field-name').text(res.name);
        }
    });
    
    $('.modal-link').click(function() {
        
        if ($('#modal-container').length == 0) {
            $('body').append('<div id="modal-container"/>');
        }
        
        var $container = $('#modal-container');
        var $frmt = $(this).data('frmt');
        var $link = $(this).attr('href');
        var $title = $(this).find('span.modal-title').html()
        
        $container.load('/templates/modal/' + $frmt, function() {
            $container.find('.modal-title').html($title);
            
            $container.find('.modal-body').load($link, function () {
                $('#modal-dialog').modal();
            });
        });
        
        return false;
    });
    
    incluirDominio = function(p_dominio, p_fanpageid, p_link) {
        if (p_dominio.length == 0) {
            alert('Digite o nome de domínio desejado!');
        } else {
            $.ajax(
                {
                    url: "http://www.mobyourlife.com.br/api/incluirdominio",
                    type: "POST",
                    dataType: "json",
                    data: {
                        dominio: p_dominio.val(),
                        fanpageid: p_fanpageid
                    }
                }
            ).done(function(res) {
                if (res.created === true) {
                    $('#modal-container .modal-body').load(p_link, function () {
                        alert('Domínio incluído com sucesso!');
                    });
                } else {
                    alert(res.message);
                }
            }).fail(function() {
                alert('Falha ao tentar incluir o domínio!\n\n');
            });
        }
    };
});
