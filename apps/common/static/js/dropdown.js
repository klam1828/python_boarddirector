function initDropdowns(t) {
    var target = $('.sublinks');

    if (t !== undefined) {
        target = t.find('.sublinks');
    }

    target.click(function() {
        var target = $(this).next('.dropdownlist');
        $('.dropdownlist').not(target).hide();
        target.toggle();
        return false;
    });
}

$(document).ready(function() {
    $(document).click(function () {
        $('.dropdownlist').hide();
    });
    initDropdowns();
});