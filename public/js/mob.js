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
        var $link = $(this).attr('href');
        var $title = $(this).find('span.modal-title').html()
        
        $container.load('/templates/modal/save-cancel', function() {
            $container.find('.modal-title').html($title);
            
            $container.find('.modal-body').load($link, function () {
                $('#modal-dialog').modal();
            });
        });
        
        return false;
    });
});
