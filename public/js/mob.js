$(document).ready(function() {
    moment.locale('pt-br');
    
    // back top button
    $('body').append('<div id="toTop" class="btn btn-info"><span class="glyphicon glyphicon-chevron-up"></span> Voltar ao topo</div>');
    $(window).scroll(function () {
        if ($(this).scrollTop() != 0) {
            $('#toTop').fadeIn();
        } else {
            $('#toTop').fadeOut();
        }
    });
    $('#toTop').click(function() {
        $("html, body").animate({ scrollTop: 0 }, 600);
    return false;
    });
    
    // timeline
    var my_posts = $("[rel=tooltip]");

    var arrange_timeline = function() {
        var size = $(window).width();
        for(i=0;i<my_posts.length;i++) {
            the_post = $(my_posts[i]);

            if(the_post.hasClass('invert') && size >=767 ) {
                the_post.tooltip({ placement: 'left'});
                the_post.css("cursor","pointer");
            } else {
                the_post.tooltip({ placement: 'rigth'});
                the_post.css("cursor","pointer");
            }
        }
    }
    
    // apis
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
    
    /* carregamento do feed */
    var $feeds = $('div.container.feeds > ul.timeline');
    var $feeds_loading = false;
    
    carregarFeeds = function() {
        var last = $feeds.find('.feed').last();
        var compl = '';
        var even = true;
        
        if (last.length == 1) {
            console.log('last: [' + last + ']');
            compl = '/' + last.data('imgtime');
        }
        
        $.get('/api/feeds' + compl, function(data) {
            if (data) {
                if (data.feeds) {
                    data.feeds.forEach(function(f) {
                        $item = (even ? '<li>' : '<li class="timeline-inverted">');
                        $item += '<div class="timeline-badge primary"><a><i class="glyphicon glyphicon-record" rel="tooltip" title="' + moment(f.time).fromNow() + ' via Facebook" id=""></i></a></div>';
                        
                        $item += '<div class="timeline-panel">';
                        
                        if (f.picture) {
                            $item += '<div class="timeline-heading"><img src="' + f.picture + '" /></div>';
                        }
                        
                        $item += '<div class="timeline-body"><p>' + (f.name ? '<strong>' + f.name + '</strong><br/>' : (f.story ? '<strong>' + f.story + '</strong><br/>' : '')) + (f.description ? f.description : '') + '</p></div>';
                        
                        $item += '<div class="timeline-footer"><a><i class="glyphicon glyphicon-thumbs-up jump-5"></i></a><a><i class="glyphicon glyphicon-share"></i></a><a class="pull-right" href="' + f.link + '" target="_blank">Continuar Lendo</a></div>';
                        
                        $item += '</div>';
                        $item += '</li>';
                        
                        even = !even;
                        $feeds.find('li.clearfix').before($item);
                    });
                    
                    arrange_timeline();
                }
            }
            $feeds_loading = false;
        });
    }
    
    if ($feeds) {
        carregarFeeds();
        
        $(document).scroll(function() {
            var diff = $(document).height() - $(window).scrollTop();
            
            if (diff < 650) {
                if ($feeds_loading == false) {
                    $feeds_loading = true;
                    //carregarFeeds();
                }
            }
        });
    }
    
    /* carregamento de fotos */
    var $fotos = $('div.container.fotos');
    var $fotos_loading = false;
    
    carregarFotos = function() {
        var last = $fotos.find('.foto').last();
        var compl = '';
        
        if (last.length == 1) {
            console.log('last: [' + last + ']');
            compl = '/' + last.data('imgtime');
        }
        
        $.get('/api/fotos' + compl, function(data) {
            if (data) {
                if (data.fotos) {
                    data.fotos.forEach(function(f) {
                        if ($('.foto[data-imgid="' + f._id + '"]').length == 0) {
                            $fotos.append('<div class="foto col-sm-4" data-imgid="' + f._id + '" data-imgtime="' + moment(f.time).unix() + '"><img src="' + f.source + '" alt="?"/></div>');
                        }
                    });
                }
            }
            $fotos_loading = false;
        });
    }
    
    if ($fotos) {
        carregarFotos();
        
        $(document).scroll(function() {
            var diff = $(document).height() - $(window).scrollTop();
            
            if (diff < 650) {
                if ($fotos_loading == false) {
                    $fotos_loading = true;
                    carregarFotos();
                }
            }
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
    
    gotoPagamento = function() {
        carregarModal('pay-close', '/opcoes/pagamento', 'Opções &gt; Pagamento', function() {
            //
        }, function() {
            // salvando
            $.ajax(
                {
                    url: "http://www.mobyourlife.com.br/pagseguro/pay",
                    type: "POST",
                    dataType: "json",
                    xhrFields: { withCredentials: true }
                }
            ).always(function(res) {
                if (res.status == 200) {
                    location.href = res.responseText;
                } else {
                    alert('Falha ao tentar realizar o pagamento! Por favor tente novamente mais tarde!');
                }
            });
        }, function() {
            // fechando
            gotoOpcoes();
        }, function() {
            // excluindo
        });
        return false;
    }
});
