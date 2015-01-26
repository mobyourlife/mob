$(document).ready(function() {
    $.ajax(
        {
            url: "http://debug.mobyourlife.com.br:3000/api/login",
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
