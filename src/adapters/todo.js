/**
 * Reference only imports (for documentation)
*/

// eslint-disable-next-line no-unused-vars
import { Logger } from 'log4js'
// eslint-disable-next-line no-unused-vars
import { DynamoRepositoryInstance } from '../ports/state-machines'
// eslint-disable-next-line no-unused-vars
import { MutateTodoInput, Todo, TodoKey } from '../business'

/**
 * code imports
 */

import {
  // eslint-disable-next-line no-unused-vars
  CustomError,
  EClassError,
  throwCustomError
} from '../utils'

import { validateUpdateTodo, validateCreateTodo, validateDeleteTodo } from '../business/todo'

/**
 * @description Handler function to get todo data by id .
 * @memberof adapters
 * @async
 * @function
 * @throws {CustomError}
 * @param {DynamoRepositoryInstance} repository - State-machine database methods.
 * @returns {Promise<getTodoReturn>} GetDocument method ready to execute.
 */
export const getTodo = (repository) => async (id) => {
  try {
    return await repository.getDocument({ id })
  } catch (error) {
    throw new CustomError(error, EClassError.INTERNAL, 'adapters.todo.getTodo')
  }
}

/**
 * @description Create todo in the DynamoDB.
 * @memberof adapters
 * @async
 * @function
 * @throws {CustomError}
 * @param {Logger} escriba instance of escriba
 * @param {DynamoRepositoryInstance} repository state-machine database methods
 * @returns {Promise<createTodoReturn>} function to call createTodo direct
 */
export const createTodo = (escriba, repository) => async (params, user) => {
  try {
    const documentInserted = await repository
      .putDocument(
        validateCreateTodo(
          params,
          user
        )
      )

    escriba.info({
      action: 'TASK_CREATED',
      method: 'adapters.todo.createTodo',
      data: { documentInserted }
    })

    return documentInserted
  } catch (error) {
    throwCustomError(error, EClassError.INTERNAL, 'adapters.todo.createTodo')
  }
}

/**
 * @description Update todo in the DynamoDB.
 * @memberof adapters
 * @async
 * @function
 * @throws {CustomError}
 * @param {Logger} escriba instance of escriba
 * @param {DynamoRepositoryInstance} repository state-machine database methods
 * @returns {Promise<updateTodoReturn>} function to call updateTodo direct
 */
export const updateTodo = (escriba, repository) => async (id, params, user) => {
  try {
    const currObject = await getTodo(repository)(id)

    const ExpressionAttributeValues = validateUpdateTodo(params, currObject, user)

    const UpdateExpression = `
    set taskOrder = :taskOrder,
        taskDescription = :taskDescription,
        taskStatus = :taskStatus,
        taskPriority = :taskPriority,
        creationData = :creationData,
        lastUpdateDate = :lastUpdateDate

    `

    // send report to existing protocol previous created
    const task = await repository.updateDocument(
      { id },
      UpdateExpression,
      ExpressionAttributeValues
    )

    // log report data
    escriba.info({
      action: 'TASK_UPDATED',
      method: 'adapters.todo.updateTodo',
      data: task
    })

    // return updated item
    return task
  } catch (error) {
    throwCustomError(error, EClassError.INTERNAL, 'adapters.todo.updateTodo')
  }
}

/**
 * @description delete todo in the DynamoDB.
 * @memberof adapters
 * @async
 * @function
 * @throws {CustomError}
 * @param {Logger} escriba instance of escriba
 * @param {DynamoRepositoryInstance} repository state-machine database methods
 * @returns {Promise<deleteTodoReturn>} function to call deleteTodo direct
 */
export const deleteTodo = (escriba, repository) => async (id, user) => {
  try {
    const currObject = validateDeleteTodo(await getTodo(repository)(id), user)
    const deletedDocument = await repository.deleteDocument({ id })

    // log report data
    escriba.info({
      action: 'TASK_DELETED',
      method: 'adapters.todo.deleteTodo',
      data: currObject
    })

    return deletedDocument || currObject
  } catch (error) {
    throwCustomError(error, EClassError.INTERNAL, 'adapters.todo.deleteTodo')
  }
}

/**
 * complex callbacks documentation
 *
 */

/**
 * This callback is displayed as part of the createTodo function.
 * @memberof adapters
 * @callback createTodoReturn
 * @param {MutateTodoInput} params input param for createTodo
 * @param {string} owner of the data entry logged
 * @returns {Promise<Todo>} new report data
 */

/**
 * This callback is displayed as part of the updateTodo function.
 * @memberof adapters
 * @callback updateTodoReturn
 * @param {string} id id of the current data for update
 * @param {MutateTodoInput} params input param for updateTodo
 * @param {string} owner of the data entry logged
 * @returns {Promise<Todo>} new report data
 */

/**
 * This callback is displayed as part of the deleteTodo function.
 * @memberof adapters
 * @callback deleteTodoReturn
 * @param {string} id id of the current data for update
 * @param {string} owner of the data entry logged
 * @returns {Promise<Todo>} new report data
 */

/**
 * This callback is displayed as part of the getTodo function.
 * @memberof adapters
 * @callback getTodoReturn
 * @param {string} id key of the data
 * @returns {Promise<Todo>} task from repository
 */
