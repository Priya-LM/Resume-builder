function show() {
    var menu = document.getElementById('menu');
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
    } else {
        menu.classList.add('active');
    }
}


$(document).ready(function() {
    var skills = [];
  
    // Function to display skills in the skillsList div
    function displaySkills() {
      $('#skillsList').empty();
      for (var i = 0; i < skills.length; i++) {
        $('#skillsList').append('<p>' + skills[i] + '</p>');
      }
    }
  
    // Event listener for the Add button
    $('#addSkill').click(function(event) {
      event.preventDefault();
      var skill = $('#skill').val();
      if (skill !== '') {
        if (skills.length < 10) {
          skills.push(skill);
          displaySkills();
          $('#skill').val('');
        } else {
          alert('You can add a maximum of 10 skills.');
        }
      }
    });
  
    // Event listener for the form submission
    $('#resumeForm').submit(function(event) {
      event.preventDefault(); // Prevent the default form submission
      if (skills.length === 0) {
        alert('Please add at least one skill.');
      } else {
        // Serialize the form data
        var formData = $(this).serialize();
        console.log(formData); // Print the serialized form data for testing
  
        // Perform your AJAX request here to submit the form data to the server
        $.ajax({
          url: '/submit', // Update the URL as per your server endpoint
          type: 'POST', // Use POST method instead of GET
          data: formData,
          success: function(response) {
            // Handle the success response
            console.log(response);
          },
          error: function(error) {
            // Handle the error response
            console.log(error);
          }
        });
      }
    });
  });
  
  
  