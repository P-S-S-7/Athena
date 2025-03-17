import agentService from "@/services/agentService";
import contactService from "@/services/contactService";
import ticketService from "@/services/ticketService";

let statusMap = {};
let priorityMap = {};
let sourceMap = {};
let typeArray = [];
let agentMap = {};
let contactMap = {};
let contactEmailMap = {};
let groupMap = {};
let agentEmailMap = {};

try {
    const ticket_fields = await ticketService.getTicketFields();

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
} catch (error) {
    console.error(error);
}

try {
    const contactResponse = await contactService.getContacts();
    contactMap = contactResponse.contacts.reduce((acc, contact) => {
        acc[contact.id] = contact.name;
        return acc;
    }
    , {});
    contactEmailMap = contactResponse.contacts.reduce((acc, contact) => {
        acc[contact.id] = contact.email;
        return acc;
    }, {});
} catch (error) {
    console.error(error);
}

try {
    const agentResponse = await agentService.getAgents();
    agentEmailMap = agentResponse.reduce((acc, agent) => {
        acc[agent.id] = agent.contact.email;
        return acc;
    }
    , {});
} catch (error) {
    console.error(error);
}

let companyMap = {};

try {
    const companyResponse = await contactService.getCompanies();
    companyMap = companyResponse.companies.reduce((acc, company) => {
        acc[company.id] = company.name;
        return acc;
    }
    , {});
}
catch (error) {
    console.error(error);
}

export { sourceMap, statusMap, priorityMap, typeArray, agentMap, contactMap, contactEmailMap, groupMap, agentEmailMap, companyMap };
