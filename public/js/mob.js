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
});
