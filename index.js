require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Cria o "cliente" do bot com as intenções necessárias
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,              // Para ver servidores
        GatewayIntentBits.GuildMessages,       // Para ver mensagens
        GatewayIntentBits.GuildMembers,        // CRUCIAL: Para ler os cargos dos membros (interaction.member)
        GatewayIntentBits.MessageContent,      // Para LER o conteúdo das mensagens
        GatewayIntentBits.GuildMessageReactions // Para ver reações (opcional)
    ]
});

/*// Quando o bot fica online
client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
    console.log(`Estou em ${client.guilds.cache.size} servidor(es)!`);
});*/

// Quando alguém envia uma mensagem
client.on('messageCreate', async message => {
    // Ignora mensagens de outros bots (evita loop infinito)
    if (message.author.bot) return;

    // Verifica se o usuário MENCIONOU o bot
    if (message.mentions.has(client.user)) {
        // Responde com uma mensagem
        await message.reply('oiiiii :3')
    }
});


// --- CONFIGURAÇÃO DOS CARGOS ---
// Cada array interno é um grupo "OU"
// Os grupos entre si são "E"
const GRUPOS_DE_CARGOS = [
    // Grupo Genero
    ['1530203921887269052', '1530203921887269051', '1530203921887269050'],
    
    // Grupo Pronome
    ['1530203921887269048', '1530203921887269047', '1530203921883336704'],

    // Grupo Sexualidade
    ['1530203921879142582', '1530203921879142581'],

    // Grupo Idade
    ['1530203921879142580', '1530203921879142579', '1530203921879142578', '1530203921879142577'],

    // Grupo Status
    ['1530203921879142576', '1530203921879142575', '1530203921879142574', '1530203921870618693', '1530203921870618692'],

    // Grupo Plataforma
    ['1530203921870618691', '1530203921870618690', '1530203921870618689', '1530203921870618688', '1530203921870618687'],

    // Grupo Regiao
    ['1530203921870618686', '1530203921870618685', '1530203921870618684', '1530203921862098973', '1530203921862098972'],

    // Grupo Cores
    ['1530203921862098970', '1530203921862098969', '1530203921862098968', '1530203921862098967', '1530203921862098966', '1530203921862098965', '1530203921862098964', '1530203921845588147']
];

const CARGO_DE_ACESSO = '1530203921899978763';

const comandoDesbloquear = new SlashCommandBuilder()
    .setName('desbloquear')
    .setDescription('Verifica seus cargos e libera seu acesso ao servidor.');

const comandoInstrucao = new SlashCommandBuilder()
    .setName('instrucao')
    .setDescription('Da instrucao duhhh');

client.once('ready', async () => {
    console.log(`✅ Bot online como ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [
                        comandoInstrucao.toJSON(),
                        comandoDesbloquear.toJSON()
                        
            ] },
        );
        console.log('Comando registrado!');
    } catch (error) {
        console.error(error);
    }
});

// --- EVENTO: QUANDO ALGUÉM ENTRA NO SERVIDOR ---
client.on('guildMemberAdd', async member => {
    // ID do canal onde a mensagem será enviada
    const CANAL_BOAS_VINDAS = '1531410767201570987';
    
    try {
        const canal = member.guild.channels.cache.get(CANAL_BOAS_VINDAS);
        
        if (!canal) {
            console.error('❌ Canal de boas-vindas não encontrado!');
            return;
        }

        // Mensagem exata que você pediu
        const mensagem = `Para acessar o servidor, faça o \n` +
                         `1. <#1530203922772398102>\n` +
                         `2. <#1530203922772398104>\n` +
                         `3. <#1530203922772398103>\n` +
                         `Após concluir tudo, use o comando: /desbloquear`;

        // Envia a mensagem mencionando o usuário
        await canal.send(`${member} ${mensagem}`);
        console.log(`✅ Mensagem de boas-vindas enviada para ${member.user.tag}`);
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem de boas-vindas:', error.message);
    }
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'instrucao') {
        await interaction.reply('Para acessar o servidor, faça o \n' +
                `1. <#1530203922772398102>\n` +
                `2. <#1530203922772398104>\n` +
                `3. <#1530203922772398103>`
            `Após concluir tudo, use o comando: /desbloquear`)
    }
    
   
    if (interaction.commandName === 'desbloquear') {
        const member = interaction.member;

        // Verifica se TODOS os grupos são atendidos
        const temTodosOsGrupos = GRUPOS_DE_CARGOS.every(grupo => {
            return grupo.some(cargoId => member.roles.cache.has(cargoId));
        });

        if (temTodosOsGrupos) {
            if (member.roles.cache.has(CARGO_DE_ACESSO)) {
                return interaction.reply({ 
                    content: '⚠️ Você já está desbloqueado!', 
                    ephemeral: true 
                });
            }

            try {
                await member.roles.add(CARGO_DE_ACESSO);
                await interaction.reply({ 
                    content: '🎉 **Acesso liberado!** Bem-vindo ao servidor.', 
                    ephemeral: true 
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ 
                    content: '❌ Erro ao dar o cargo. Verifique a hierarquia.', 
                    ephemeral: true 
                });
            }
        } else {
            // Mensagem mais detalhada sobre o que falta
            const gruposFaltando = [];
            
            GRUPOS_DE_CARGOS.forEach((grupo, index) => {
                const temAlgum = grupo.some(cargoId => member.roles.cache.has(cargoId));
                if (!temAlgum) {
                    gruposFaltando.push(`Grupo ${index + 1}`);
                }
            });

            await interaction.reply({ 
                content: `❌ É necessário concluir todo o registro!`, 
                ephemeral: true 
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);