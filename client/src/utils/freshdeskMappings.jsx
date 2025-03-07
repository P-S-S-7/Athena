import agentService from "@/services/agentService";
import contactService from "@/services/contactService";
import ticketService from "@/services/ticketService";

const ticket_fields = await ticketService.getTicketFields();

const statusMap = {};
const priorityMap = {};
const sourceMap = {};
const typeArray = [];
const agentMap = {};
const groupMap = {};

ticket_fields.forEach(field => {
    if (field.name === 'status') {
        Object.keys(field.choices).forEach(key => {
            statusMap[parseInt(key)] = field.choices[key][0];
        });
    } else if (field.name === 'priority') {
        Object.keys(field.choices).forEach(key => {
            priorityMap[field.choices[key]] = key;
        });
    } else if (field.name === 'source') {
        Object.keys(field.choices).forEach(key => {
            sourceMap[field.choices[key]] = key;
        });
    } else if (field.name === 'ticket_type') {
        typeArray.push(...field.choices)
    } else if (field.name === 'agent') {
        Object.keys(field.choices).forEach(key => {
            agentMap[field.choices[key]] = key;
        });
    } else if (field.name === 'group') {
        Object.keys(field.choices).forEach(key => {
            groupMap[field.choices[key]] = key;
        });
    }
});

const contactResponse = await contactService.getContacts();
const contactMap = contactResponse.reduce((acc, contact) => {
    acc[contact.id] = contact.name;
    return acc;
}
, {});
const contactEmailMap = contactResponse.reduce((acc, contact) => {
    acc[contact.id] = contact.email;
    return acc;
}, {});

const agentResponse = await agentService.getAgents();
const agentEmailMap = agentResponse.reduce((acc, agent) => {
    acc[agent.id] = agent.contact.email;
    return acc;
}
, {});


export { sourceMap, statusMap, priorityMap, typeArray, agentMap, contactMap, contactEmailMap, groupMap, agentEmailMap };
