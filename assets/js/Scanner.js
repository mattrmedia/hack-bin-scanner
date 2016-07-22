$(function () {
    $('#code-scan').codeScanner({
        onScan: function ($element, code) {
            if(code.match(/BIN/)) {
                console.log("Updating BIN number");
                $(".bin_barcode").data("bin", code);
            } else if(code.match(/\d{2}[A-Z]{3}/)) {
                console.log("Updating ITEM number");
                if($(".bin_barcode").data("bin") == "") {
                    alert("No BIN selected.  Scan BIN to add Item.")
                } else {
                    $(".item_barcode").data("item", code);
                    addItemToBin();
                }
            } else {
                console.log("WHAT'D YOU DO!?!");
            }
        }
    });

    function addItemToBin() {
        var bin = $(".bin_barcode").data("bin");
        var item = $(".item_barcode").data("item");
        console.log("Adding ITEM " + item + " to BIN " + bin);
        $(".item_barcode").data("item", "");
    }

});
