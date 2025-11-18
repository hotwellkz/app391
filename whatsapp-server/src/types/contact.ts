export interface Contact {
    contactId: string; // Номер телефона без @c.us
    customName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContactsStore {
    [contactId: string]: Contact;
}

export interface CreateContactRequest {
    contactId: string;
    customName: string;
}

export interface UpdateContactRequest {
    customName: string;
}

export interface ContactResponse {
    success: boolean;
    contact?: Contact;
    message?: string;
    error?: string;
}

export interface ContactsResponse {
    success: boolean;
    contacts?: ContactsStore;
    message?: string;
    error?: string;
} 