require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/persons')

const app = express()

morgan.token('body', (req) => {
  return JSON.stringify(req.body)
})

const requestLogger = (request, response, next) => {
  if (!request.body) {
    console.log('No request body provided')
  } else {
    console.log('Request Body: ', request.body)
  }
  next()
}

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())
app.use(requestLogger)
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body'),
)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted Id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.get('/api/persons/info', (request, response) => {
  Person.countDocuments({}).then((count) => {
    console.log('Numbers of people: ', count)
    response.send(
      `<p>Phonebook has info for ${count} people</p><br>${new Date()}`,
    )
  })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then((result) => {
    response.json(result)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (!person) {
        response.status(404).end()
      } else {
        response.json(person)
      }
    })
    .catch((error) => {
      console.log(`Error when finding by id: ${error}`)
      next(error)
    })
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch((error) => {
      console.log(`Error when finding by id and deleting: ${error}.`)
      next(error)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body
  Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' },
  )
    .then((updatedPerson) => {
      if (updatedPerson) {
        response.json(updatedPerson)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => {
      console.log(`Error updating person: ${error}`)
      next(error)
    })
})

app.post('/api/persons', (request, response, next) => {
  const person = request.body

  Person.findOne({ name: person.name }).then((foundPerson) => {
    if (foundPerson) {
      return response.status(400).json({ error: 'Name must be unique' })
    }

    const addPerson = new Person({
      name: person.name,
      number: person.number,
    })

    return addPerson.save()
  })
    .then(savedPerson => {
      if (savedPerson) {
        response.json(savedPerson)
        console.log(`added ${savedPerson.name} number ${savedPerson.number} to phonebook`)
      }
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
