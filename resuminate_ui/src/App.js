import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatPopup from './chatPopup';
import { Button, Container, TextField } from '@mui/material';
import { Snackbar } from '@mui/material';
import { Typography, Grid } from '@mui/material';
import backgroundImage from './resuminate.png';
import { Box } from '@mui/material';




function App() {
  const location = useLocation();
  const [selectedFile, setSelectedFile] = useState(null);

  const [queryParamValue, setQueryParamValue] = useState(null);
  const [jobSkills, setJobSkills] = useState(''); // skills fetched from job description

  const [missingSkills, setMissingSkills] = useState('');


  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');


  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('jobID'); 
    setQueryParamValue(value);

    const fetchData = async () => {
      const response = await fetch('https://resuminate-backend-lozf7taqoa-uc.a.run.app/job_description/', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/'+value,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setJobSkills(data.job_description); // set jobSkills instead of skills
        console.log(data);
      } else {
        console.error('Error:', response.status, response.statusText);
      }
    };

    fetchData();
  }, [location]);

  const findSkillsMismatch = async () => {
    const params = new URLSearchParams(location.search);
    const value = params.get('jobID'); 
    const response = await fetch('https://resuminate-backend-lozf7taqoa-uc.a.run.app/missing_skills/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/'+value,
      }),
    });
  
    if (response.ok) {
      const data = await response.json();
      setMissingSkills(data.missing_skills); // pretty-print the JSON data
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  };
  

  const handleUploadResume = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('https://resuminate-backend-lozf7taqoa-uc.a.run.app/upload_file/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        // handle the response data as needed
        setSnackbarMessage('File uploaded successfully');
        setOpenSnackbar(true);
      } else {
        console.error('Error:', response.status, response.statusText);
        setSnackbarMessage('File upload failed');
        setOpenSnackbar(true);
      }
    }
  };
  

  return (
    <Container maxWidth="lg" style={{
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      height: '100vh',
      width: '100vw',
    }}>

    <Box display="flex" justifyContent="center" alignItems="center" height="20vh">
      <Typography variant="h1" component="h1" style={{ fontFamily: '"Pacifico", cursive' }}>
        Resuminate
      </Typography>
    </Box>

      <TextField
        label="Job Skills required for the job: "
        multiline
        minRows={4}
        value={jobSkills} // Display the job skills
        variant="outlined"
        fullWidth
        margin="normal"
        style={{
          backgroundColor: '#f0f0f0', // change this to the desired background color
          color: '#333', // change this to the desired font color
        }}
      />

      <Grid container direction="column" spacing={2}>
        <Grid item>
          <Grid container direction="row" spacing={2} alignItems="center">
            <Grid item>
              <input type="file" onChange={e => setSelectedFile(e.target.files[0])} />
            </Grid>

            <Grid item>
              <Button variant="contained" color="primary" onClick={handleUploadResume}>
                Upload Resume
              </Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item>
          <Button variant="contained" color="primary" onClick={findSkillsMismatch}>
            Find Skills Mismatch
          </Button>
        </Grid>
      </Grid>

      <TextField
        label="Missing Skills"
        multiline
        minRows={4}
        value={missingSkills} // Display the missing skills
        variant="outlined"
        fullWidth
        margin="normal"
        style={{
          backgroundColor: '#f0f0f0', // change this to the desired background color
          color: '#333', // change this to the desired font color
        }}
      />

      <ChatPopup />


      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    
    </Container>
  );
}

export default App;
