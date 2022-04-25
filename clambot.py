# Clam Bot

import discord
from discord.ext import commands
import random
import datetime
import urllib.request
import urllib.parse
import re
import json
from googleapiclient.discovery import build
from google.cloud import secretmanager



intents = discord.Intents.default()
intents.members = True
#intents.message_content = True

bot = commands.Bot(command_prefix='$', description='Sentient Clam', intents=intents)

@bot.event
async def on_ready():
    await bot.change_presence(activity=discord.Streaming(name="Deep Sea Clamming", url="https://https://www.twitch.tv/mdsolarflare"))
    print(f'The clam is now present. user:{bot.user} id:{bot.user.id}')

@bot.listen()
async def on_message(message):
    if message.author == bot.user:
        return

    if message.content.startswith('$hello'):
        channel_name = message.channel.name
        is_bot_channel = 'smarter-clam' == channel_name
        print(f'channel name is [{channel_name}] is bot channel:{is_bot_channel}')

        if is_bot_channel:
            #this later will called process_clam(message) from the clam lib
            await message.channel.send('you are in the bot channel')
        else:
            await message.channel.send('Hello!')

@bot.command()
async def source(ctx):
    await ctx.send('Hi, the deep sea location of my source code is here: https://github.com/mdsolarflare/clambot-discord')

def get_reddit(ctx, subreddit, limit=1000):
    try:
        json_blob = json.loads(urllib.request.urlopen(f'https://www.reddit.com/r/{subreddit}/.json?limit={limit}').read())
    except Exception as e:
        print(f'{e}')
        ctx.send(f'You asked for something but I could not find a subreddit for that.')

    # unpack the json to get a list of urls
    url_list = ""
    return url_list


@bot.command()
async def find(ctx, search_term):
    # get the def for get_reddit(ctx, search_term) working first
    await ctx.send(f'Sorry, this feature is still in progress, will look for {search_term} later')

def get_service():
    # Get developer key from "credentials" tab of api dashboard
    return build("youtube", "v3", developerKey="key")

def search_on_youtube(term, channel):
    service = get_service()
    resp = service.search().list(
        part="id",
        q=term,
        safeSearch="none" if channel.is_nsfw() else "moderate",
        videoDimension="2d",
    ).execute()
    return resp["items"][0]["id"]["videoId"]

@bot.command()
async def youtube(ctx, *, search):
    await ctx.send(search_on_youtube(search, ctx))

def get_local_token():
    token = open('./tok.tok', 'r').read()
    return token

def get_gcp_secret():
    # Setup the Secret manager Client
    #google_secret_manager = secretmanager.SecretManagerServiceClient()
    # get the secret
    #resource_name = 'projects/heyy-dev-site/secrets/heyy-dev-discord/versions/latest'
    #response = google_secret_manager.access_secret_version(name=resource_name)
    #discord_key = response.payload.data.decode('UTF-8')
    #print('secret: {0}'.format(discord_key)
    print('not implemented')



bot.run(get_local_token())