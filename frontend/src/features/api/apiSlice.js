import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL;

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Loans', 'Friends', 'User'],
  endpoints: (builder) => ({
    verifyOrRegister: builder.mutation({
      query: (userData) => ({
        url: '/auth/verify-or-register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (user) => ({
        url: '/auth/register',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: ['User'],
    }),
    getFriends: builder.query({
      query: () => '/friends',
      providesTags: ['Friends'],
    }),
    searchFriends: builder.query({
      query: (query) => `/friends/search?query=${query}`,
    }),
    addFriend: builder.mutation({
      query: (friendId) => ({
        url: '/friends',
        method: 'POST',
        body: { friend_id: friendId },
      }),
      invalidatesTags: ['Friends'],
    }),
    getTopScorers: builder.query({
      query: () => '/friends/top-scorers',
    }),
    getLoans: builder.query({
      query: (request) => `/loans?is_borrower=${request.is_borrower}&is_request=${request.is_request}`,
      providesTags: ['Loans'],
    }),
    requestLoan: builder.mutation({
      query: (loanRequest) => ({
        url: '/loans/request',
        method: 'POST',
        body: loanRequest,
      }),
      invalidatesTags: ['Loans'],
    }),
    approveLoan: builder.mutation({
      query: (loanId) => ({
        url: '/loans/approve',
        method: 'POST',
        body: loanId,
      }),
      invalidatesTags: ['Loans'],
    }),
    rejectLoan: builder.mutation({
      query: (loanId) => ({
        url: '/loans/reject',
        method: 'POST',
        body: loanId,
      }),
      invalidatesTags: ['Loans'],
    }),
    repayLoan: builder.mutation({
      query: (repayRequest) => ({
        url: '/loans/repay',
        method: 'POST',
        body: repayRequest,
      }),
      invalidatesTags: ['Loans'],
    }),
    requestRenegotiation: builder.mutation({
      query: (reRequest) => ({
        url: '/loans/request-renegotiation',
        method: 'POST',
        body: reRequest,
      }),
      invalidatesTags: ['Loans'],
    }),
    approveRenegotiation: builder.mutation({
      query: (loanId) => ({
        url: '/loans/approve-renegotiation',
        method: 'POST',
        body: loanId,
      }),
      invalidatesTags: ['Loans'],
    }),
    addPublicKey: builder.mutation({
      query: (publicKey) => ({
        url: '/auth/add-public-key',
        method: 'POST',
        body: { public_key: publicKey },
      }),
      invalidatesTags: ['User', 'Loans'],
    }),
    sendNotification: builder.mutation({
      query: (notification) => ({
        url: '/notifications/send',
        method: 'POST',
        body: notification,
      }),
    }),
    storeNotification: builder.mutation({
      query: (notification) => ({
        url: '/notifications/store',
        method: 'POST',
        body: notification,
      }),
    }),
    getNotifications: builder.query({
      query: () => `/notifications/list`,
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notifications/delete/${id}`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useVerifyOrRegisterMutation,
  useLoginMutation,
  useRegisterMutation,
  useGetFriendsQuery,
  useSearchFriendsQuery,
  useAddFriendMutation,
  useGetTopScorersQuery,
  useGetLoansQuery,
  useRequestLoanMutation,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useRepayLoanMutation,
  useAddPublicKeyMutation,
  useRequestRenegotiationMutation,
  useApproveRenegotiationMutation,
  useSendNotificationMutation,
  useStoreNotificationMutation,
  useGetNotificationsQuery,
  useDeleteNotificationMutation,
} = apiSlice;
