from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import openai

from langchain.agents import initialize_agent, Tool
from langchain.chat_models import ChatOpenAI
from langchain.agents import tool
from langchain.agents import AgentType, initialize_agent
from langchain.prompts import PromptTemplate
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory

import requests
from bs4 import BeautifulSoup
from google.cloud import secretmanager
import fitz
import re
import os


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


project_id = "lablabhackathon"
secret_id = "openai-api-key"
version_id = "version1"

name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"

def access_secret_version(project_id, secret_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()
    name = client.secret_version_path(project_id, secret_id, version_id)

    # Access the secret version
    response = client.access_secret_version(request={"name": name})

    # Return the decoded payload
    return response.payload.data.decode('UTF-8')

os.environ["OPENAI_API_KEY"] = access_secret_version(project_id, secret_id, version_id)
llm = ChatOpenAI(model_name='gpt-4', temperature=0)
memory = ConversationBufferMemory()
conversation = ConversationChain(
    llm=llm,
    memory=memory,
    verbose=False
)


class ChatIn(BaseModel):
    message: str
    first_conv = True


@tool
def get_job_description(url) -> str:
    """Scrapes the LinkedIn using job id and gets the texts associated with the given job"""
    html_content = requests.get(url).text
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text()
    clean_text = re.sub(r'\s+', ' ', text)
    return clean_text

@tool
def extract_resume(filepath) -> str:
    """Reads the resume from the path provided"""
    doc = fitz.open(filepath)
    for page in doc:
        text = page.get_text()
    return text

class JobDescription(BaseModel):
    url: str

@app.post("/job_description/")
async def read_job_description(description: JobDescription):
    tools = [get_job_description, extract_resume]
    agent = initialize_agent(tools, llm, agent="chat-zero-shot-react-description", verbose=True, max_iterations=3)
    prompt = PromptTemplate(input_variables = ['url'],
          template = '''
          You have been given access to scrapped data about an opening from LinkedIn.
          Please give the technical frameworks and programming languages required for job with url {url} based on the response using the get_job_description tool.
           '''
        )
    result = agent.run(prompt.format_prompt(url=description.url))
    return {"job_description": result}


@app.post("/upload_file/")
async def create_file(file: UploadFile = None):
    if not file:
        raise HTTPException(status_code=400, detail="File not provided")

    file_location = f"./tmp/{file.filename}"

    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    return JSONResponse(status_code=200, content={"message": "File uploaded successfully.", "filename": file.filename})


class ResumeSkills(BaseModel):
    url: str


@app.post("/missing_skills/")
async def read_missing_skills(resume: ResumeSkills):
    filepath = ['./tmp/' + item for item in os.listdir('./tmp') if item.endswith('.pdf')][0]

    tools = [get_job_description, extract_resume]
    # Set up the Agent, give it the tools
    agent = initialize_agent(tools,
                            llm,
                            agent="chat-zero-shot-react-description",
                            verbose=True,
                            max_iterations=3)
    prompt = PromptTemplate(input_variables = ['url'],
          template = '''
          You have been given access to scrapped data about an opening from LinkedIn.
          Please give the technical frameworks and programming languages required for job with url {url} based on the response using the get_job_description tool.
           '''
        )
    # Run the agent with the provided input variable
    result = agent.run(prompt.format_prompt(url=resume.url))

    prompt = PromptTemplate(input_variables = ['filepath', 'result'],
        template = '''
          You have been given access to job description for an opening in an organization from LinkedIn as well as the resume of a mine.
          Based on the exhaustive analysis please pinpoint requirements of technical frameworks, programming languages, or other skills gathered from {result} and
          mine based on the client resume {filepath}, find the skill that the I am lacking/missing.
           '''
        )
    
    # Run the agent with the provided input variable
    missing_skills = agent.run(prompt.format_prompt(result = result, filepath=filepath))

    return {"missing_skills": missing_skills}
    

@app.post("/chat")
async def chat(chat_in: ChatIn):
    filepath = ['./tmp/' + item for item in os.listdir('./tmp') if item.endswith('.pdf')][0]
    if filepath:
        if chat_in.first_conv:
            context = f"""You are an interviewer bot and you are supposed to take interview of the candidate based on his or her resume. The resume details are {extract_resume(filepath)}. Do not ask question in more than 5 sentences. Avoid discussing topics, which are out of topic. When the candidates replies/asks about out-of-topic question then answer with - please stick to the interview or you will be disqualified."""
            session_history = "context: " + context + chat_in.message
            response = conversation.predict(input=session_history)
            chat_in.first_conv = False
        else:
            response = conversation.predict(input=chat_in.message)
        
        return {"response": response}
    else:
        return {"response": "please upload resume!"}