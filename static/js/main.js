(function(w){

    var winH = $(window).height();
    var winW = $(window).width();
    var headerH = $(".navbar").height();
    var alertH = $(".alert").height();
    var filterH = $("#filter_block").height();
    var tableContainerH = winH - headerH - alertH - filterH - 90;  // approximation height of table container

	$(document).ready(function() {

    	// show the success message
		var success = GetQueryStringParams('q');
		if (success) {
    		$('#success_message').show();
		}
		else {
    		$('#success_message').hide();
		}

		buildScrollTable();

		getSpaceCount();
		toggleEditExportButtons();

		$('.dropdown-toggle').dropdown();

		$(".populate-column").tooltip({
            'placement': 'top',
            'animation': true,
        });


	});

	$(w).resize(function(){ //Update dimensions on resize

	    winH = $(window).height();
        winW = $(window).width();
        headerH = $(".navbar").height();
        alertH = $(".alert").height();
        filterH = $("#filter_block").height();
        tableContainerH = winH - headerH - alertH - filterH - 90;  // approximation height of table container

    	buildScrollTable();
	});

	//show filter block
	$('#filter_block_button').click(function(e){
    	e.preventDefault();
    	$('#filter_block').toggleClass('slidedown');
        // wait for the filter block to slide down before resetting the table scroll height
        //setTimeout(setTableScrollHeight, 699);
	});


	// check individual checkboxes
	$('.fixedTable tr input:checkbox').click(function(){
        // check the corresponding checkbox
        $(this).prop('checked', this.checked);
        // toggle buttons based on checkbox
        toggleEditExportButtons();
     });

	// check all checkboxes
	$('#check_all_checkbox').click(function(){

    	// check all the checkboxes
    	//$('.fixedTable').closest('.check').find(':checkbox').prop('checked', this.checked);
    	$('.fixedTable').find(':checkbox').attr('checked','checked');
    	// toggle buttons based on checkboxes
    	toggleEditExportButtons();
	});

	// export button
	$('#export_button').click(function(e) {

        if($('#export_button').hasClass('disabled')) {
            e.preventDefault();
        }
        else {
            window.location.href = '/download';
            return false;
        }

    });

	// edit button
	$('#edit_button').click(function(e) {

    	// disable the edit button by default unless a space has been "checked"
        if($('#edit_button').hasClass('disabled')) {
            e.preventDefault();
        }
        else {
            var space_count = $('#space_list_body tr input:checkbox:checked').length;
            // pass number of checked spaces to hidden field
            $('#checked_spaces_count').val(space_count);
        }

    });

    // save button
	$('#save_button').click(function(e) {

    	$(".table-container input:text:visible").each(function (i) {
        	if ( $(this).val().length === 0 ) {
            	$(this).addClass("blah");
        	}
        	else {
            	$(this).removeClass("blah");
        	}
    	});

    	var empties = $('.blah').length;

    	if (empties == 0){
        	window.location.href = '/?q=success';
    	}
    	else {
        	$('#error_message').show();
    	}

    	console.log(empties);

    	// if any visible input are empty, show error alert
    	/*if( $('.table-container').find('input:text:visible').val().length == 0 ) {
        	$('#error_message').show();
    	}
    	else {
        	// else go back to space list page
        	window.location.href = '/?q=success';
    	}*/


    });

    // cancel button
	$('#cancel_button').click(function() {
        window.location.href = '/';
        return false;
    });

    // batch upload button
    $('#batch_upload_button').click(function(e) {

    	// disable the batch upload button by default unless a space has been "checked"
        if($('#batch_upload_button').hasClass('disabled')) {
            e.preventDefault();
        }
        else {

        }

    });

    // add space button
    $('#add_space_button').click(function(e) {

    	// disable the add spaces button by default unless a space has been "checked"
        if($('#add_space_button').hasClass('disabled')) {
            e.preventDefault();
        }
        else {

        }

    });

    // add multiple spaces button
    $('#add_multiple_button').click(function(e) {

    	// disable the add spaces button by default unless a space has been "checked"
        if($('#add_multiple_button').hasClass('disabled')) {
            e.preventDefault();
        }
        else {

        }

    });

    // add rows button
    $('#add_rows_button').click(function(e) {
        e.preventDefault();
        $('.add-new').show();
        setTableScrollHeight();
    });

	// get a count of spaces
	function getSpaceCount() {
    	var rowCount = $('#space_list_body tr').length;
    	$('#table_num_spaces').html(rowCount + "&nbsp;spaces");
	}

	// toggle edit and export buttons
	function toggleEditExportButtons() {

    	if($('.fixedTable tr input:checkbox:checked').length > 1){

        	$('#edit_button').removeClass('disabled');
        	$('#export_button').removeClass('disabled');

        	$('#batch_upload_button').addClass('disabled');
        	$('#add_multiple_button').addClass('disabled');
        	$('#add_space_button').addClass('disabled');
    	}
    	else {

        	$('#edit_button').addClass('disabled');
        	$('#export_button').addClass('disabled');

        	$('#batch_upload_button').removeClass('disabled');
        	$('#add_multiple_button').removeClass('disabled');
        	$('#add_space_button').removeClass('disabled');
    	}
	}

	function buildScrollTable() {

	    var maintbheight = tableContainerH;
        var maintbwidth = winW - 64;

        console.log("table"+tableContainerH + "maintable" + maintbheight);

        // fixed table
		$(".tableDiv").each(function() {

            var Id = $(this).get(0).id;

            $("#" + Id + " .FixedTables").fixedTable({
                width: maintbwidth,
                height: maintbheight,
                fixedColumns: 3,
                classHeader: "fixedHead",
                classFooter: "fixedFoot",
                classColumn: "fixedColumn",
                fixedColumnWidth: 300,
                outerId: Id,
                backcolor: "#FFFFFF",
                hovercolor: "#99CCFF"
            });
        });
	}

	function GetQueryStringParams(sParam) {
        var sPageURL = window.location.search.substring(1);
        var sURLVariables = sPageURL.split('&');
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            if (sParameterName[0] == sParam)
            {
                return sParameterName[1];
            }
        }
    }



})(this);