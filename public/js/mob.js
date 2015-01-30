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
    
    var $fotos = $('div.container.fotos');
    
    if ($fotos) {
        $.get('/api/fotos', function(data) {
            if (data) {
                if (data.fotos) {
                    data.fotos.forEach(function(f) {
                        $fotos.append('<div class="col-sm-4"><img src="' + f.source + '" alt="?"/></div>');
                    });
                }
            }
            console.log(data.fotos);
        });
    }
    
    carregarModal = function(template, action, title, onLoaded, onClickSave, onClickClose, onClickDelete) {
        if ($('#modal-container').length == 0) {
            $('body').append('<div id="modal-container"/>');
        }
        
        var $container = $('#modal-container');
        
        $container.load('/templates/modal/' + template, function() {
            $container.find('.modal-body').load(action, function () {
                $container.find('.modal-title').html(title);
                
                $('#modal-dialog #save').click(function() {
                    if (onClickSave) {
                        onClickSave();
                    }
                });
                
                $('#modal-dialog #close').click(function() {
                    if (onClickClose) {
                        onClickClose();
                    }
                });
                
                $('#modal-dialog #delete').click(function() {
                    if (onClickDelete) {
                        onClickDelete();
                    }
                });
                
                if (onLoaded) {
                    onLoaded();
                }
                
                $('#modal-dialog').modal();
            });
        });
    }
    
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
                alert('Falha ao tentar incluir o domínio!');
            });
        }
    }
    
    gotoOpcoes = function() {
        carregarModal('close', '/opcoes', 'Opções');
        return false;
    }
    
    gotoDominio = function(p_dominio) {
        carregarModal('delete-close', '/opcoes/dominio/' + p_dominio, 'Opções &gt; Domínio', function() {
            $('.label-dominio').html(p_dominio);
        }, function() {
            // salvando
        }, function() {
            // fechando
            gotoOpcoes();
        }, function() {
            // excluindo
            if (confirm('Deseja excluir o domínio "' + p_dominio + '"?')) {
                $.ajax(
                    {
                        url: "http://www.mobyourlife.com.br/api/excluirdominio",
                        type: "POST",
                        dataType: 'json',
                        data: {
                            dominio: p_dominio
                        }
                    }
                ).always(function() {
                    gotoOpcoes();
                });
            }
        });
        return false;
    }
});
