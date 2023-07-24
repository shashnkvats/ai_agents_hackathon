import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';

function ChatPopup() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    const newMessage = `Candidate: ${message} `;
    setMessages(messages + newMessage);

    // Get the current message history from the sessionStorage
    const currentChat = sessionStorage.getItem('chat') || '';

    // Add the new message to the message history
    const updatedChat = currentChat + newMessage;

    // Store the updated message history in the sessionStorage
    sessionStorage.setItem('chat', updatedChat);

    const response = await fetch('https://resuminate-backend-lozf7taqoa-uc.a.run.app/chat', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: updatedChat,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const botMessage = `Bot: ${data.response} `;
      setMessages(messages + botMessage);

      // Add the bot's message to the message history
      sessionStorage.setItem('chat', updatedChat + botMessage);
    } else {
      console.error('Error:', response.status, response.statusText);
    }
  };

  const chatSession = sessionStorage.getItem('chat') || '';
  const chatHistory = chatSession.split(/(?=Bot:|Candidate:)/).map(message => {
    const sender = message.startsWith('Bot:') ? 'Bot' : 'Candidate';
    const text = message;
    return { sender, text };
  });
  
  
  return (
    <div>

      <Button variant="outlined" color="primary" onClick={handleClickOpen} style={{ position: 'absolute', right: 20, bottom: 20 }}>
        <ChatIcon fontSize="large" />
      </Button>



      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Chat</DialogTitle>
        <DialogContent>
          <List>
            {chatHistory.map((message, index) => (
              <ListItem key={index} style={{flexDirection: message.sender === 'Candidate' ? 'row' : 'row-reverse'}}>
                <ListItemIcon>
                  {message.sender === 'Candidate' ? <FaceIcon /> : <SmartToyIcon />}
                </ListItemIcon>
                <ListItemText primary={message.text.replace(/^(Bot: |Candidate: )/, '')} />
              </ListItem>
            ))}
          </List>
          <TextField
            autoFocus
            margin="dense"
            id="message"
            label="Your Message"
            type="text"
            fullWidth
            value={message}
            onChange={handleMessageChange}
          />
          <Button onClick={handleSendMessage} color="primary">
            Send
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatPopup;
