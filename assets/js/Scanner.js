$(function () {
    $('#code-scan').codeScanner({
        onScan: function ($element, code) {
            resetSvgs();
            if (code.match(/BIN/)) {
                console.log("Updating BIN number");
                $(".scanner__welcome").addClass('hidden');
                $(".scanner__bin").removeClass("hidden")
                    .data("bin", code)
                    .html(code);
            } else if (code.match(/\d{2}[A-Z]{3}/)) {
                console.log("Updating ITEM number");
                if ($(".bin_barcode").data("bin") == "") {
                    alert("No BIN selected.  Scan BIN to add Item.")
                } else {
                    $(".scanner__item").removeClass('hidden')
                        .data("item", code)
                        .html(code);
                    addItemToBin();
                }
            } else {
                console.log("WHAT'D YOU DO!?!");
            }
        }
    });

    function addItemToBin() {
        var bin = $(".scanner__bin").data("bin");
        var item = $(".scanner__item").data("item");

        var body = {bin_barcode: bin, barcode: item};

        $.ajax({
            type: "POST",
            url: "https://staging.ebth.com/api/bins",
            data: body,
            dataType: 'json',
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", "Token token=fe420ac77d9360dbdca56aa0b3aa5851");
            },
            success: function () {
                $(".svg.svg__check").removeClass('hidden');
            },
            error: function () {
                $(".svg.svg__opps").removeClass('hidden');
            }
        })
    }

    function resetSvgs() {
        $(".svg.svg__check").addClass('hidden');
        $(".svg.svg__opps").addClass('hidden');
    }

});
