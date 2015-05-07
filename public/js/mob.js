var $csrf_token = '';

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
    
    // full screen images
    $('body').append('<div id="fullscreen"></div>');
    $('div#fullscreen').hide();
    
    var fullScreen = function(img) {
        if ($('div#fullscreen').css('display') == 'none') {
            $('div#fullscreen').css('background-image', 'url("' + $(this).data('imgsrc') + '")');
            $('div#fullscreen').html('<div class="embed-half"><a class="closeFullScreen">&times;</a></div>');
            $('div#fullscreen').show();
        } else {
            $('div#fullscreen').html('');
            $('div#fullscreen').hide();
        }
    }
    $('div#fullscreen').click(fullScreen);
    
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
            url: "https://www.mobyourlife.com.br/api/login",
            type: "GET",
            dataType: 'json',
            xhrFields: { withCredentials: true }
        }
    ).done(function(res) {
        if (res.auth && res.auth === true) {
            $('.loggedout').hide();
            $('.isowner').hide();
            $('.loggedin').show();

            if (res.isowner && res.isowner === true) {
                $('.isowner').show();
                $('.isnotowner').hide();
                tour.start();
            }
            
            $('.field-name').text(res.name);
            $csrf_token = res.csrf;
        }
    });
    
    /* carregamento do feed */
    var $container = $('div.container.feeds');
    var $feeds = $container.find('ul.timeline');
    var $feeds_loading = false;
    
    carregarFeeds = function() {
        var last = $feeds.find('.feed').last();
        var compl = '';
        var even = true;
        
        if (last.length == 1) {
            compl = '/' + last.data('imgtime');
        }
        
        $container.activity();
        
        $.get('https://www.mobyourlife.com.br/api/feeds' + compl, function(data) {
            if (data) {
                var $items = $(data);
                for (i = 0; i < $items.length; i++) {
                    if ($('li.feed[data-imgid="' + $($items[i]).data('imgid') + '"]').length == 0) {
                        if ((($('li.feeed').length + i) % 2) != 0) {
                            $($items[i]).addClass('timeline-inverted');
                        }
                        $feeds.find('li.clearfix').before($items[i]);
                    }
                }
                arrange_timeline();
            }
            $container.activity(false);
            $feeds_loading = false;
            
            if ($('li.feed').length === 0) {
                $('.page-rows').hide();
                $('.page-empty').show();
            } else {
                $('.page-rows').show();
                $('.page-empty').hide();
            }
        });
    }
    
    if ($feeds.length != 0) {
        carregarFeeds();
        
        $(document).scroll(function() {
            var diff = $(document).height() - $(window).scrollTop();
            
            if (diff < 1000) {
                if ($feeds_loading == false) {
                    $feeds_loading = true;
                    carregarFeeds();
                }
            }
        });
    }
    
    /* carregamento de fotos */
    var $fotos = $('div.container.fotos');
    var $fotos_loading = false;
    
    carregarFotos = function() {
        var last = $fotos.find('.foto-container').last();
        var compl = '';
        
        if (last.length == 1) {
            compl = '/' + last.data('imgtime');
        }
        
        var album = location.href.substring(location.href.lastIndexOf('/') + 1).split('#')[0];
        
        $fotos.activity();
        
        $.get('https://www.mobyourlife.com.br/api/fotos' + (album && album != 'fotos' ? '-' + album : '') + compl, function(data) {
            if (data) {
                if (data.fotos) {
                    data.fotos.forEach(function(f) {
                        if ($('.foto-container[data-imgid="' + f._id + '"]').length == 0) {
                            if (f.name && f.name.length >= 40) {
                                f.name = f.name.substring(0, 40) + '...';
                            }
                            
                            $fotos.append('<div class="foto-container col-xs-12 col-sm-6 col-md-4 col-lg-4 text-center" data-imgid="' + f._id + '" data-imgtime="' + moment(f.time).unix() + '" data-imgsrc="' + (f.cdn ? f.cdn : f.source) + '"><div class="foto" style="background-image: url(\'' + (f.cdn ? f.cdn : f.source) + '\');"><img src="/img/blank-4x3.png" alt="Mob Your Life"/></div>' + (f.name ? f.name : '&nbsp;') + '</div>');
                            $('.foto-container[data-imgid="' + f._id + '"]').click(fullScreen);
                        }
                    });
                }
                $('.page-rows').show();
            }
            $fotos.activity(false);
            $fotos_loading = false;
            
            if ($('div.foto-container').length === 0) {
                $('.page-rows').hide();
                $('.page-empty').show();
            } else {
                $('.page-rows').show();
                $('.page-empty').hide();
            }
        });
    }
    
    if ($fotos.length != 0) {
        carregarFotos();
        
        $(document).scroll(function() {
            var diff = $(document).height() - $(window).scrollTop();
            
            if (diff < 1000) {
                if ($fotos_loading == false) {
                    $fotos_loading = true;
                    carregarFotos();
                }
            }
        });
    }
    
    /* carregamento de vídeos */
    var $videos = $('div.container.videos');
    var $videos_loading = false;
    
    carregarVideos = function() {
        var last = $videos.find('.video-container').last();
        var compl = '';
        
        if (last.length == 1) {
            compl = '/' + last.data('imgtime');
        }
        
        $videos.activity();
        
        $.get('https://www.mobyourlife.com.br/api/videos' + compl, function(data) {
            if (data) {
                console.log(data);
                if (data.videos) {
                    data.videos.forEach(function(f) {
                        if ($('.video-container[data-imgid="' + f._id + '"]').length == 0) {
                            if (f.name && f.name.length >= 40) {
                                f.name = f.name.substring(0, 40) + '...';
                            }
                            
                            var link = f.link;
                            link = link.replace('m.youtube.com/watch?v=', 'youtube.com/embed/');
                            link = link.replace('youtube.com/watch?v=', 'youtube.com/embed/');
                            link = link.replace('facebook.com/video.php?v=', 'facebook.com/video/embed?video_id=');
                            
                            $videos.append('<div class="video-container col-xs-12 col-sm-6 col-md-4 col-lg-4 text-center" data-imgid="' + f._id + '" data-imgtime="' + moment(f.time).unix() + '"><div class="embed-responsive embed-responsive-4by3"><iframe class="embed-responsive-item" src="' + link + '"></iframe></div></div>');
                        }
                    });
                }
                $('.page-rows').show();
            }
            $videos.activity(false);
            $videos_loading = false;
            
            if ($('div.video-container').length === 0) {
                $('.page-rows').hide();
                $('.page-empty').show();
            } else {
                $('.page-rows').show();
                $('.page-empty').hide();
            }
        });
    }
    
    if ($videos.length != 0) {
        carregarVideos();
        
        $(document).scroll(function() {
            var diff = $(document).height() - $(window).scrollTop();
            
            if (diff < 1000) {
                if ($fotos_loading == false) {
                    $fotos_loading = true;
                    carregarVideos();
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
        var forbidden = /^.*\.mobyourlife\.com/;
        
        if (p_dominio.length == 0) {
            alert('Digite o nome de domínio desejado!');
        } else if(forbidden.exec(p_dominio.val())) {
            alert('Nome de domínio não permitido!');
        } else {
            $.ajax(
                {
                    url: "https://www.mobyourlife.com.br/api/incluirdominio",
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
                        gotoNovoDominio(p_dominio.val());
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
    
    // alterar foto de capa
    $('body').append('<form id="formCover" method="POST" enctype="multipart/form-data" action="/api/upload-cover"><input id="btnChangeCover" style="display: none;" type="file" name="cover" onchange="loadCoverPhoto(event);"/><input id="coverHeight" type="hidden" name="height" value="0"></form>');
    
    var $resizing = false;
    var $origin_y = 0;
    var $origin_h = 0;
    
    loadCoverPhoto = function(event) {
        var url = URL.createObjectURL(event.target.files[0]);
        $('.jumbotron').css('background-image', 'url("' + url + '")');
        
        if (!$('.jumbotron').hasClass('adjustable')) {
            $('.jumbotron').empty().append('<div id="adjustable"><a id="resizeCover" class="btn btn-info fa-2x glyphicon glyphicon-resize-vertical" title="Clique e arraste para redimensionar"></a> <a id="saveCover" class="btn btn-success fa-2x resize glyphicon glyphicon-floppy-disk" title="Salvar a capa atual"></a>  <a id="cancelCover" class="btn btn-danger fa-2x resize glyphicon glyphicon-remove" title="Cancelar"></a></div>');
            $('.jumbotron').addClass('adjustable');
            
            var handleResizeStart = function(clientY) {
                $resizing = true;
                $origin_y = clientY;
                $origin_h = $('.jumbotron').height();
            }
            
            var handleResizeMove = function(clientY) {
                if ($resizing === true) {
                    dif = clientY - $origin_y;
                    $('.jumbotron').height($origin_h + dif);
                }
            }
            
            var handleResizeFinish = function() {
                $resizing = false;
            }
            
            $('#resizeCover').mousedown(function(event) {
                handleResizeStart(event.clientY);
            });
            
            $('body').mousemove(function(event) {
                handleResizeMove(event.clientY);
            });
            
            $('body').mouseup(function(event) {
                handleResizeFinish();
            });
            
            if ("ontouchstart" in window) {
                $('#resizeCover').bind('touchstart', function(event) {
                    handleResizeStart(event.originalEvent.touches[0].clientY);
                });

                $('body').bind('touchmove', function(event) {
                    handleResizeMove(event.originalEvent.touches[0].clientY);
                });

                $('body').bind('touchend', function(event) {
                    handleResizeFinish();
                });
            }

            $('#saveCover').click(function() {
                $('.jumbotron').empty().activity();
                $('#coverHeight').val(parseInt($('.jumbotron').css('height')));
                $('#formCover').submit();
            });
            
            $('#cancelCover').click(function() {
                location.reload();
            });
        }
    }
    
    gotoFotoCapa = function() {
        $('#btnChangeCover').click();
        return false;
    }
    
    removerFotoCapa = function() {
        $('.jumbotron').css('background-image', '');
        
        if (!$('.jumbotron').hasClass('adjustable')) {
            $('.jumbotron').empty().append('<div id="adjustable"><a id="saveCover" class="btn btn-success fa-2x resize glyphicon glyphicon-floppy-disk" title="Salvar a capa atual"></a> <a id="cancelCover" class="btn btn-danger fa-2x resize glyphicon glyphicon-remove" title="Cancelar"></a></div>');
            $('.jumbotron').addClass('adjustable');

            $('#saveCover').click(function() {
                $('.jumbotron').empty().activity();
                $('#coverHeight').val(0);
                $('#formCover').submit();
            });
            
            $('#cancelCover').click(function() {
                location.reload();
            });
        }
        
        return false;
    }
    
    // etc
    
    gotoNovoDominio = function(p_dominio) {
        carregarModal('close', '/opcoes/dominio/' + p_dominio, 'Domínio vinculado com sucesso!', function() {
            $('.label-dominio').html(p_dominio);
        }, function() {
            // salvando
        }, function() {
            // fechando
            gotoOpcoes();
        }, function() {
            // excluindo
        });
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
                        url: "https://www.mobyourlife.com.br/api/excluirdominio",
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
                    url: "https://www.mobyourlife.com.br/pagseguro/pay",
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
    
    var currentTheme = null;
    
    $('.theme-preview').click(function() {
        if(!currentTheme) {
            currentTheme = $('#mob-theme').attr('href');
        }
        
        var $theme = $(this).parent().parent();
        $('#mob-theme').attr('href', $theme.data('css'));
    });
    
    $('.mob-theme').click(function() {
        alert($(this).data('css'));
        return false;
    });
    
    excluirPaginaTexto = function() {
        if (confirm("Deseja excluir esta página estática?\n\nEsta ação é irreversível!")) {
            $('form').attr('action', '/paginas-estaticas/excluir/' + $('input[name="id"]').val());
            $('form').submit();
        }
    }
    
    $('[data-action="album-special"]').click(function() {
        var album_id = $(this).parent().parent().data('albumid');
        var special_type = $(this).data('special');
        $('body').activity();
        
        $.ajax(
            {
                url: "https://www.mobyourlife.com.br/api/set-album",
                type: "POST",
                dataType: 'json',
                xhrFields: { withCredentials: true },
                data: {
                    _csrf: $csrf_token,
                    album_id: album_id,
                    special_type: special_type
                }
            }
        ).always(function(res) {
            if (res.status == 200) {
                location.reload();
            } else {
                $('body').activity(false);
            }
        });
    });
});

function imageFailed(imgid) {
    var $parent = $('.feed[data-imgid="' + imgid + '"]');
    $parent.find('img').hide();
    
    if ($parent.find('div.timeline-body').length === 0) {
        $parent.hide();
    }
}
